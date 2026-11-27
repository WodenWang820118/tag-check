import type { Browser, Response } from '@playwright/test';

const NAVIGATION_TIMEOUT_MS = 30_000;
const NETWORK_IDLE_TIMEOUT_MS = 5_000;
// Tags injected by a tag manager (such as GTM) load late after initial load.
const TAG_MANAGER_SETTLE_MS = 750;
const LAZY_SCROLL_SETTLE_MS = 250;
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 8;
const VIOLATIONS_STORAGE_KEY = '__cspCheckViolations';

export interface CspViolation {
  source: 'event' | 'console';
  violatedDirective: string;
  effectiveDirective: string;
  blockedURI: string;
  sourceFile: string;
  lineNumber: number;
  disposition: string;
  message?: string;
}

export interface PageCspResult {
  route: string;
  status: number | null;
  loadError: string | null;
  hasPolicy: boolean;
  violations: CspViolation[];
}

interface CollectViolationsOptions {
  blockExternal?: boolean;
  concurrency?: number;
}

interface RecordedEventViolation {
  violatedDirective: string;
  effectiveDirective: string;
  blockedURI: string;
  sourceFile: string;
  lineNumber: number;
  disposition: string;
}

function parseConsoleCspViolation(text: string): CspViolation {
  const directiveMatch = text.match(
    /Content Security Policy directive:\s*"([^"]+)"/i
  );
  const uriMatch = text.match(/Refused to [^']* '([^']+)'/i);
  const rawDirective = directiveMatch?.[1]?.trim() ?? '';
  const directiveName = rawDirective.split(/\s+/, 1)[0] || 'console-error';

  return {
    source: 'console',
    violatedDirective: directiveName,
    effectiveDirective: directiveName,
    blockedURI: uriMatch?.[1]?.trim() ?? '',
    sourceFile: '',
    lineNumber: 0,
    disposition: 'enforce',
    message: text
  };
}

function isNonNetworkScheme(url: string): boolean {
  return (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('about:')
  );
}

async function inspectSingleRoute(
  browser: Browser,
  siteOrigin: string,
  routePath: string,
  blockExternal: boolean
): Promise<PageCspResult> {
  const context = await browser.newContext();
  const consoleViolations: CspViolation[] = [];

  try {
    await context.addInitScript((storageKey: string) => {
      const target = globalThis as Record<string, unknown>;
      const entries: RecordedEventViolation[] = [];
      target[storageKey] = entries;

      document.addEventListener('securitypolicyviolation', (event) => {
        entries.push({
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          disposition: event.disposition
        });
      });
    }, VIOLATIONS_STORAGE_KEY);

    if (blockExternal) {
      await context.route('**/*', async (interceptedRoute) => {
        const requestUrl = interceptedRoute.request().url();
        if (isNonNetworkScheme(requestUrl)) {
          await interceptedRoute.continue();
          return;
        }

        try {
          const requestOrigin = new URL(requestUrl).origin;
          if (requestOrigin !== siteOrigin) {
            await interceptedRoute.abort();
            return;
          }
        } catch {
          await interceptedRoute.abort();
          return;
        }

        await interceptedRoute.continue();
      });
    }

    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() !== 'error') {
        return;
      }

      const text = message.text();
      if (text.includes('Content Security Policy')) {
        consoleViolations.push(parseConsoleCspViolation(text));
      }
    });

    const targetUrl = new URL(routePath, siteOrigin).href;
    let response: Response | null = null;
    try {
      response = await page.goto(targetUrl, {
        waitUntil: 'load',
        timeout: NAVIGATION_TIMEOUT_MS
      });
    } catch (error) {
      return {
        route: routePath,
        status: null,
        loadError: error instanceof Error ? error.message : String(error),
        hasPolicy: false,
        violations: []
      };
    }

    if (!response) {
      return {
        route: routePath,
        status: null,
        loadError: 'Navigation returned no response.',
        hasPolicy: false,
        violations: []
      };
    }

    const status = response.status();
    if (status >= 400) {
      return {
        route: routePath,
        status,
        loadError: `HTTP ${status}`,
        hasPolicy: false,
        violations: []
      };
    }

    await page
      .waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT_MS })
      .catch(() => undefined);
    await page.waitForTimeout(TAG_MANAGER_SETTLE_MS);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(LAZY_SCROLL_SETTLE_MS);

    const pageData = await page.evaluate((storageKey: string) => {
      const target = globalThis as Record<string, unknown>;
      const raw = target[storageKey];
      const recorded = Array.isArray(raw)
        ? (raw as RecordedEventViolation[])
        : [];
      const metaPolicy = document.querySelector(
        'meta[http-equiv="Content-Security-Policy" i]'
      );
      const hasMetaPolicy =
        metaPolicy !== null &&
        Boolean(metaPolicy.getAttribute('content')?.trim());

      return { recorded, hasMetaPolicy };
    }, VIOLATIONS_STORAGE_KEY);

    const headers = response.headers();
    const hasHeaderPolicy = Boolean(headers['content-security-policy']?.trim());
    const eventViolations: CspViolation[] = pageData.recorded.map((entry) => ({
      source: 'event',
      ...entry
    }));

    return {
      route: routePath,
      status,
      loadError: null,
      hasPolicy: hasHeaderPolicy || pageData.hasMetaPolicy,
      violations: [...eventViolations, ...consoleViolations]
    };
  } finally {
    await context.close();
  }
}

/**
 * Visits each route in a fresh Playwright browser context and collects any
 * `securitypolicyviolation` events and CSP console errors.
 */
export async function collectViolations(
  browser: Browser,
  origin: string,
  routes: readonly string[],
  options: CollectViolationsOptions = {}
): Promise<PageCspResult[]> {
  if (routes.length === 0) {
    return [];
  }

  const siteOrigin = new URL(origin).origin;
  const blockExternal = options.blockExternal ?? false;
  const requestedConcurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const concurrency = Math.max(
    1,
    Math.min(MAX_CONCURRENCY, Math.trunc(requestedConcurrency))
  );
  const workerCount = Math.min(concurrency, routes.length);
  const results: PageCspResult[] = new Array<PageCspResult>(routes.length);

  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < routes.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const routePath = routes[currentIndex];
      if (routePath === undefined) {
        return;
      }

      results[currentIndex] = await inspectSingleRoute(
        browser,
        siteOrigin,
        routePath,
        blockExternal
      );
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
