import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

import { isMainModule } from '../shared/entrypoint/entrypoint.ts';
import { collectViolations } from './collect-violations.ts';
import type { CspViolation, PageCspResult } from './collect-violations.ts';
import { routesFromDirectory, routesFromSitemap } from './sitemap-routes.ts';
import { startStaticServer } from './static-server.ts';
import type { StaticServerHandle } from './static-server.ts';

const DEFAULT_SITEMAP_PATH = '/sitemap.xml';
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 8;

export interface CliOptions {
  dir?: string;
  url?: string;
  sitemap: string;
  blockExternal: boolean;
  requirePolicy: boolean;
  maxRoutes?: number;
  concurrency: number;
}

export interface CheckReport {
  pagesChecked: number;
  pagesWithViolations: number;
  pagesWithLoadErrors: number;
  pagesWithoutPolicy: number;
  distinctPairs: string[];
  lines: string[];
  exitCode: 0 | 1;
}

function readFlagValue(
  argv: readonly string[],
  index: number,
  flagName: string,
  inlineValue?: string
): { value: string; nextIndex: number } {
  if (inlineValue !== undefined) {
    if (!inlineValue) {
      throw new Error(`Missing value for ${flagName}.`);
    }
    return { value: inlineValue, nextIndex: index };
  }

  const nextArg = argv[index + 1];
  if (!nextArg || nextArg.startsWith('--')) {
    throw new Error(`Missing value for ${flagName}.`);
  }

  return { value: nextArg, nextIndex: index + 1 };
}

function parsePositiveInt(raw: string, flagName: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${flagName} must be a positive integer, got "${raw}".`);
  }

  const parsed = Number.parseInt(raw, 10);
  if (parsed < 1) {
    throw new Error(`${flagName} must be at least 1, got "${raw}".`);
  }

  return parsed;
}

function normalizeSitemapPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('--sitemap must not be empty.');
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function parseCliArgs(argv: readonly string[]): CliOptions {
  let dir: string | undefined;
  let url: string | undefined;
  let sitemap = DEFAULT_SITEMAP_PATH;
  let blockExternal = false;
  let requirePolicy = true;
  let maxRoutes: number | undefined;
  let concurrency = DEFAULT_CONCURRENCY;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument "${arg}".`);
    }

    const eqIndex = arg.indexOf('=');
    const flagName = eqIndex === -1 ? arg : arg.slice(0, eqIndex);
    const inlineValue = eqIndex === -1 ? undefined : arg.slice(eqIndex + 1);

    switch (flagName) {
      case '--dir': {
        const parsed = readFlagValue(argv, i, flagName, inlineValue);
        dir = parsed.value;
        i = parsed.nextIndex;
        break;
      }
      case '--url': {
        const parsed = readFlagValue(argv, i, flagName, inlineValue);
        url = parsed.value;
        i = parsed.nextIndex;
        break;
      }
      case '--sitemap': {
        const parsed = readFlagValue(argv, i, flagName, inlineValue);
        sitemap = normalizeSitemapPath(parsed.value);
        i = parsed.nextIndex;
        break;
      }
      case '--block-external': {
        if (inlineValue !== undefined) {
          throw new Error('--block-external does not take a value.');
        }
        blockExternal = true;
        break;
      }
      case '--require-policy': {
        if (inlineValue !== undefined) {
          throw new Error('--require-policy does not take a value.');
        }
        requirePolicy = true;
        break;
      }
      case '--no-require-policy': {
        if (inlineValue !== undefined) {
          throw new Error('--no-require-policy does not take a value.');
        }
        requirePolicy = false;
        break;
      }
      case '--max-routes': {
        const parsed = readFlagValue(argv, i, flagName, inlineValue);
        maxRoutes = parsePositiveInt(parsed.value, flagName);
        i = parsed.nextIndex;
        break;
      }
      case '--concurrency': {
        const parsed = readFlagValue(argv, i, flagName, inlineValue);
        const value = parsePositiveInt(parsed.value, flagName);
        if (value > MAX_CONCURRENCY) {
          throw new Error(
            `--concurrency must be at most ${MAX_CONCURRENCY}, got ${value}.`
          );
        }
        concurrency = value;
        i = parsed.nextIndex;
        break;
      }
      default:
        throw new Error(`Unknown option "${flagName}".`);
    }
  }

  if ((dir === undefined && url === undefined) || (dir && url)) {
    throw new Error('Specify exactly one of --dir or --url.');
  }

  if (url !== undefined) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`Invalid --url "${url}".`);
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(`--url must use http or https, got "${url}".`);
    }
    url = parsedUrl.origin;
  }

  return {
    dir,
    url,
    sitemap,
    blockExternal,
    requirePolicy,
    maxRoutes,
    concurrency
  };
}

export function shortenBlockedUri(rawUri: string): string {
  const trimmed = rawUri.trim();
  if (!trimmed) {
    return '(none)';
  }

  if (trimmed.startsWith('data:')) {
    return (trimmed.split(',')[0] ?? trimmed).split(/[?#]/, 1)[0] ?? 'data:';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return trimmed.split(/[?#]/, 1)[0] ?? trimmed;
    }
  }

  return trimmed.split(/[?#]/, 1)[0] ?? trimmed;
}

function extractUriOrigin(rawUri: string): string {
  const trimmed = rawUri.trim();
  if (!trimmed) {
    return '(none)';
  }

  if (trimmed.startsWith('data:')) {
    return 'data:';
  }

  if (trimmed.startsWith('blob:')) {
    return 'blob:';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).origin;
    } catch {
      return trimmed.split(/[?#]/, 1)[0] ?? trimmed;
    }
  }

  return trimmed.split(/[?#]/, 1)[0] ?? trimmed;
}

function formatViolationItem(violation: CspViolation): string {
  const directive =
    violation.effectiveDirective || violation.violatedDirective || 'unknown';
  const shortened = shortenBlockedUri(violation.blockedURI);
  return `${directive} -> ${shortened}`;
}

export function evaluateResults(
  results: readonly PageCspResult[],
  requirePolicy: boolean
): CheckReport {
  const lines: string[] = [];
  const pairSet = new Set<string>();
  let pagesWithViolations = 0;
  let pagesWithLoadErrors = 0;
  let pagesWithoutPolicy = 0;

  for (const result of results) {
    if (result.loadError !== null) {
      pagesWithLoadErrors += 1;
      lines.push(`[LOAD ERROR] ${result.route} | ${result.loadError}`);
      continue;
    }

    if (result.violations.length > 0) {
      pagesWithViolations += 1;
      const formattedViolations = result.violations.map(formatViolationItem);
      lines.push(
        `[VIOLATION] ${result.route} | ${formattedViolations.join('; ')}`
      );

      for (const violation of result.violations) {
        const directive =
          violation.effectiveDirective ||
          violation.violatedDirective ||
          'unknown';
        const origin = extractUriOrigin(violation.blockedURI);
        pairSet.add(`${directive} → ${origin}`);
      }
    }

    if (requirePolicy && !result.hasPolicy) {
      pagesWithoutPolicy += 1;
      lines.push(
        `[NO POLICY] ${result.route} | No Content-Security-Policy header or <meta> tag`
      );
    }
  }

  const distinctPairs = [...pairSet].sort();
  const pairsText =
    distinctPairs.length === 0 ? 'none' : distinctPairs.join(', ');
  lines.push(
    `Summary: checked=${results.length}, violations=${pagesWithViolations}, pairs=${pairsText}`
  );

  const passed =
    results.length > 0 &&
    pagesWithViolations === 0 &&
    pagesWithLoadErrors === 0 &&
    pagesWithoutPolicy === 0;

  return {
    pagesChecked: results.length,
    pagesWithViolations,
    pagesWithLoadErrors,
    pagesWithoutPolicy,
    distinctPairs,
    lines,
    exitCode: passed ? 0 : 1
  };
}

async function fetchSitemapRoutes(
  origin: string,
  sitemapPath: string
): Promise<string[]> {
  const sitemapUrl = new URL(sitemapPath, origin).href;
  const response = await fetch(sitemapUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to load sitemap ${sitemapUrl}: HTTP ${response.status}`
    );
  }

  const xml = await response.text();
  return routesFromSitemap(xml, origin);
}

async function runCli(argv: readonly string[]): Promise<number> {
  const options = parseCliArgs(argv);
  let server: StaticServerHandle | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    let origin: string;
    let directoryRoutes: string[] = [];

    if (options.dir !== undefined) {
      const resolvedDir = resolve(options.dir);
      if (!existsSync(resolvedDir) || !statSync(resolvedDir).isDirectory()) {
        throw new Error(`Directory does not exist: ${resolvedDir}`);
      }
      server = await startStaticServer(resolvedDir);
      origin = server.origin;
      directoryRoutes = routesFromDirectory(resolvedDir);
    } else if (options.url !== undefined) {
      origin = options.url;
    } else {
      throw new Error('Specify exactly one of --dir or --url.');
    }

    // A built directory lists its own pages. Its sitemap names the deployed
    // site's URLs, which the host may rewrite (the default locale is served
    // under a locale prefix that has no folder), so it is read only for --url.
    let routes =
      options.dir !== undefined
        ? directoryRoutes
        : await fetchSitemapRoutes(origin, options.sitemap);

    if (options.maxRoutes !== undefined) {
      routes = routes.slice(0, options.maxRoutes);
    }

    if (routes.length === 0) {
      throw new Error('No routes found to check.');
    }

    browser = await chromium.launch();
    const results = await collectViolations(browser, origin, routes, {
      blockExternal: options.blockExternal,
      concurrency: options.concurrency
    });

    const report = evaluateResults(results, options.requirePolicy);
    for (const line of report.lines) {
      console.log(line);
    }

    return report.exitCode;
  } finally {
    if (browser) {
      await browser.close();
    }
    if (server) {
      await server.close();
    }
  }
}

if (isMainModule(import.meta.url)) {
  runCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
