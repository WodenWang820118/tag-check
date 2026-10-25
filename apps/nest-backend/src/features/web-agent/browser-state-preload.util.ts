import type { Browser, CookieData, Page } from 'puppeteer';
import type { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';

type Application = EventInspectionPresetDto['application'];

/**
 * Builds the browser-side script that writes the preset's localStorage.
 *
 * It is source text on purpose. The backend bundle is compiled to ES5, where
 * swc turns code such as `typeof value === 'object'` into calls to helpers
 * that exist only in the Node bundle; a function handed to page.evaluate()
 * would throw on them in the page and write nothing.
 */
export function localStorageScript(application: Application): string | null {
  const data = application?.localStorage?.data ?? [];
  if (!data.length) {
    return null;
  }

  const entries = data.map((setting) => [
    String(setting.key),
    typeof setting.value === 'object'
      ? JSON.stringify(setting.value)
      : String(setting.value)
  ]);
  return `(function () {
  var entries = ${JSON.stringify(entries)};
  for (var i = 0; i < entries.length; i++) {
    localStorage.setItem(entries[i][0], entries[i][1]);
  }
})();`;
}

/**
 * Registers the preset's localStorage as an init script, so every document
 * the page loads from now on starts with it. Does nothing for an empty preset.
 */
export async function preloadApplicationLocalStorage(
  page: Page,
  application: Application
): Promise<void> {
  const script = localStorageScript(application);
  if (!script) {
    return;
  }

  await page.evaluateOnNewDocument(script);
}

/**
 * Writes the preset's localStorage into the site's origin before any page of
 * the site loads. Tag Assistant opens the site in a window of its own, so an
 * init script on a page we control comes too late for a site that loads GTM
 * only once it finds stored consent, and the preview never connects. The
 * navigation is answered with an empty document, so the site itself does not
 * load or send hits.
 */
export async function seedSiteLocalStorage(
  browser: Browser,
  siteUrl: string,
  application: Application
): Promise<void> {
  const script = localStorageScript(application);
  if (!script) {
    return;
  }

  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // A request still in flight when the page closes below cannot be
      // answered; the rejection must not escape as an unhandled one.
      request
        .respond({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><title></title>'
        })
        .catch(() => undefined);
    });
    await page.goto(new URL(siteUrl).origin);
    await page.evaluate(script);
  } finally {
    await page.close();
  }
}

/**
 * Sets the preset's cookies on the host of `siteUrl` before the run opens the
 * site. Does nothing for an empty preset; throws when `siteUrl` is not a valid
 * URL and there are cookies to set.
 */
export async function applyPresetCookies(
  browser: Browser,
  siteUrl: string,
  application: Application
): Promise<void> {
  const cookies = application.cookie.data;
  if (!cookies.length) {
    return;
  }
  const domain = new URL(siteUrl).hostname;
  const cookieData: CookieData[] = cookies.map((cookie) => ({
    name: cookie.key.toString(),
    value: cookie.value.toString(),
    domain
  }));
  await browser.setCookie(...cookieData);
}
