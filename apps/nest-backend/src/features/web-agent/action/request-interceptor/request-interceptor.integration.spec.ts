import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import puppeteer, { Browser, Page } from 'puppeteer';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { Ga4RequestMatcher } from './ga4-request-matcher.service';
import {
  RequestInterceptionHandle,
  RequestInterceptorService
} from './request-interceptor.service';

/**
 * Drives real Chrome against a local page that sends GA4-shaped requests the
 * way gtag.js does, including the keepalive request it sends on `pagehide`
 * when a click navigates away. Pages load before capture is armed, as in
 * tag-check's GTM preview flow. The collect endpoint is served by the same
 * local server, like a server-side container on a first-party domain.
 */
const MAIN_PAGE = `<!doctype html><title>Fixture #1</title>
<a id="next" href="/next">next</a>
<a id="other-origin" href="">other origin</a>
<script>
  document.getElementById('other-origin').href =
    location.href.replace('127.0.0.1', 'localhost') + 'next';
  const collectUrl = (query) =>
    'http://127.0.0.1:' + location.port + '/g/collect?v=2&tid=G-TEST&dt=Fixture%20%231' + query;
  window.sendOnPageHide = (transport, eventName) =>
    addEventListener('pagehide', () => {
      const url = collectUrl('&en=' + eventName);
      if (transport === 'beacon') navigator.sendBeacon(url, '');
      else fetch(url, { method: 'POST', keepalive: true });
    });
  window.sendBatch = () =>
    fetch(collectUrl(''), {
      method: 'POST',
      keepalive: true,
      body: 'en=select_content&ep.content_type=product\\r\\nen=login&ep.method=Google'
    }).then((response) => response.status);
</script>`;

/** The functions MAIN_PAGE defines on window. */
type FixtureWindow = typeof globalThis & {
  sendOnPageHide(transport: string, eventName: string): void;
  sendBatch(): Promise<number>;
};

const chromeAvailable = await puppeteer
  .executablePath()
  .then(existsSync, () => false);

/** Generous because CI runs this next to other suites; matches production's default. */
const CAPTURE_TIMEOUT_MS = 15_000;
const BROWSER_HOOK_TIMEOUT_MS = 60_000;

describe.skipIf(!chromeAvailable)('RequestInterceptorService in Chrome', () => {
  let server: Server;
  const receivedEventNames = new Set<string>();
  let origin: string;
  let browser: Browser;
  const service = new RequestInterceptorService(
    {
      updateSelfDataLayerAlgorithm: vi.fn().mockResolvedValue(undefined)
    } as unknown as DataLayerService,
    new Ga4RequestMatcher()
  );

  beforeAll(async () => {
    server = createServer((request, response) => {
      if (request.url?.startsWith('/g/collect')) {
        const eventName = new URL(request.url, 'http://local').searchParams.get(
          'en'
        );
        if (eventName) receivedEventNames.add(eventName);
        request.resume();
        response.writeHead(204).end();
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html' }).end(MAIN_PAGE);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    browser = await puppeteer.launch({
      headless: true,
      args: process.platform === 'linux' ? ['--no-sandbox'] : []
    });
  }, BROWSER_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    await closeBrowser(browser);
    server?.closeAllConnections();
    await new Promise((resolve) => server?.close(resolve));
  }, BROWSER_HOOK_TIMEOUT_MS);

  async function openPage(): Promise<Page> {
    const page = await browser.newPage();
    await page.goto(`${origin}/`);
    return page;
  }

  function capture(page: Page, eventName: string) {
    return service.setupInterception(
      page,
      'project',
      'event-id',
      eventName,
      'G-TEST'
    );
  }

  function captured(handle: RequestInterceptionHandle) {
    return firstValueFrom(handle.rawRequest$.pipe(timeout(CAPTURE_TIMEOUT_MS)));
  }

  // Under heavy CPU load Chrome may kill the old document of a cross-origin
  // navigation before its pagehide handler runs, so the request never leaves
  // the browser. That is real browser behaviour (GA loses the hit too), so the
  // test only demands a capture when the request actually reached the server.
  it.for([
    ['fetch', '#next', 'pagehide_fetch'],
    ['beacon', '#next', 'pagehide_beacon'],
    ['fetch', '#other-origin', 'pagehide_cross_origin']
  ])(
    'captures a %s request sent on pagehide when %s is clicked',
    { timeout: CAPTURE_TIMEOUT_MS + 10_000 },
    async ([transport, link, eventName], { skip }) => {
      const page = await openPage();
      const handle = await capture(page, eventName);

      await page.evaluate(
        (selectedTransport, name) =>
          (globalThis as FixtureWindow).sendOnPageHide(selectedTransport, name),
        transport,
        eventName
      );
      await Promise.all([page.waitForNavigation(), page.click(link)]);

      try {
        const params = new URL(await captured(handle)).searchParams;
        expect(params.get('en')).toBe(eventName);
        expect(params.get('dt')).toBe('Fixture #1');
      } catch (error) {
        if (!(error instanceof TimeoutError)) throw error;
        expect(receivedEventNames.has(eventName)).toBe(false);
        skip('Chrome did not send the pagehide request');
      } finally {
        await handle.stop();
        await page.close();
      }
    }
  );

  it('captures from a batched body alongside page.authenticate and releases requests after stop', async () => {
    const page = await browser.newPage();
    await page.authenticate({ username: '', password: '' });
    await page.goto(`${origin}/`);
    const handle = await capture(page, 'login');

    await expect(
      page.evaluate(() => (globalThis as FixtureWindow).sendBatch())
    ).resolves.toBe(204);

    const params = new URL(await captured(handle)).searchParams;
    expect(params.getAll('en')).toEqual(['login']);
    expect(params.get('ep.method')).toBe('Google');
    expect(params.has('ep.content_type')).toBe(false);

    await handle.stop();
    await expect(
      page.evaluate(() => (globalThis as FixtureWindow).sendBatch())
    ).resolves.toBe(204);
    await page.close();
  });
});

/** A graceful close can take a minute on a starved CPU; kill Chrome instead of waiting. */
async function closeBrowser(browser: Browser | undefined): Promise<void> {
  if (!browser) return;
  const chrome = browser.process();
  const closed = browser.close().then(
    () => true,
    () => false
  );
  const timedOut = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), 10_000)
  );
  if (!(await Promise.race([closed, timedOut]))) {
    chrome?.kill('SIGKILL');
  }
}
