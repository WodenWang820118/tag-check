import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import type { ElementCandidate } from '@utils';
import { collectCandidatesSource } from './collect-candidates.script';

const chromeAvailable = (() => {
  try {
    return existsSync(puppeteer.executablePath());
  } catch {
    return false;
  }
})();

const fixture = `<!doctype html><title>Blue hoodie</title>
<main>
  <form>
    <label for="size">Size</label>
    <select id="size" name="size"><option>M</option></select>
    <button type="button" data-testid="add-to-bag">Add to bag</button>
    <button type="button" aria-label="Save &quot;Blue&quot; for later">♡</button>
    <button type="button">Buy now</button>
    <button type="button">Buy now</button>
    <input type="hidden" name="sku" value="123">
    <button type="button" style="display:none">Hidden</button>
  </form>
  <a href="/cart"><img alt="Cart" src="data:,"></a>
  <div role="tab" tabindex="0">Reviews</div>
  <div>Plain text</div>
</main>`;

describe.skipIf(!chromeAvailable)('collectCandidatesSource in Chromium', () => {
  let browser: Browser;
  let page: Page;
  let result: {
    url: string;
    title: string;
    viewport: { width: number; height: number };
    candidatesFound: number;
    candidates: ElementCandidate[];
  };
  const byName = (name: string) =>
    result.candidates.filter((candidate) => candidate.name === name);

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: process.platform === 'linux' ? ['--no-sandbox'] : []
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 700 });
    await page.setContent(fixture);
    result = (await page.evaluate(
      collectCandidatesSource(50)
    )) as typeof result;
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
  });

  it('describes the page', () => {
    expect(result.title).toBe('Blue hoodie');
    expect(result.viewport).toEqual({ width: 1024, height: 700 });
  });

  it('lists the visible elements a person can act on, in document order', () => {
    expect(result.candidates.map((candidate) => candidate.name)).toEqual([
      // The label, then the select it names.
      'Size',
      'Size',
      'Add to bag',
      'Save "Blue" for later',
      'Buy now',
      'Buy now',
      'Cart',
      'Reviews'
    ]);
    expect(result.candidatesFound).toBe(8);
  });

  it('gives each a role, its attributes and a box', () => {
    const [add] = byName('Add to bag');
    expect(add).toMatchObject({
      tag: 'button',
      role: 'button',
      attributes: { type: 'button', 'data-testid': 'add-to-bag' }
    });
    expect(add.box.width).toBeGreaterThan(0);
    expect(byName('Size').map((candidate) => candidate.tag)).toEqual([
      'label',
      'select'
    ]);
    expect(byName('Size')[1].role).toBe('combobox');
    expect(byName('Cart')[0]?.role).toBe('link');
    expect(byName('Reviews')[0]?.role).toBe('tab');
  });

  it('gives selectors that each match only that element', async () => {
    const [add] = byName('Add to bag');
    expect(add.selectors[0]).toBe('[data-testid="add-to-bag"]');
    expect(byName('Save "Blue" for later')[0].selectors).toContain(
      'button[aria-label="Save \\"Blue\\" for later"]'
    );

    for (const candidate of result.candidates) {
      expect(candidate.selectors.length).toBeGreaterThan(0);
      for (const selector of candidate.selectors) {
        expect(await page.$$eval(selector, (found) => found.length)).toBe(1);
      }
    }
  });

  it('tells twins apart by their place', () => {
    const [first, second] = byName('Buy now');
    expect(first.selectors).not.toEqual(second.selectors);
    expect(second.selectors.at(-1)).toMatch(/button:nth-of-type\(4\)$/);
  });

  it('keeps only the first `limit` candidates', async () => {
    const limited = (await page.evaluate(collectCandidatesSource(2))) as {
      candidatesFound: number;
      candidates: unknown[];
    };
    expect(limited.candidates).toHaveLength(2);
    expect(limited.candidatesFound).toBe(8);
  });
});
