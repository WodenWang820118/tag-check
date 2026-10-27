import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { chooseFallbackCandidate, type Step } from '@utils';
import { StepFailureCollectorService } from './step-failure-collector.service';

const chromeAvailable = (() => {
  try {
    return existsSync(puppeteer.executablePath());
  } catch {
    return false;
  }
})();

/**
 * The button moved into a new wrapper, so the structural path recorded
 * earlier matches nothing. The test hook is unchanged.
 */
const movedButton = `<!doctype html><title>Moved</title>
<style>button{width:120px;height:40px}</style>
<main>
  <div class="new">
    <button type="button" data-testid="add-to-cart">Add to cart</button>
  </div>
</main>
<script>
document.querySelector('[data-testid="add-to-cart"]').addEventListener('click', function () {
  document.body.dataset.clicked = 'yes';
});
</script>`;

/** Two buttons share a name and nothing else was recorded. */
const twinButtons = `<!doctype html><title>Twins</title>
<style>button{width:120px;height:40px}</style>
<main>
  <button type="button">Add to cart</button>
  <button type="button">Add to cart</button>
</main>`;

const recordedPath = 'main > div.old > [data-testid="add-to-cart"]';

describe.skipIf(!chromeAvailable)('a rule-based selector fallback', () => {
  let browser: Browser;
  const collector = new StepFailureCollectorService();

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: process.platform === 'linux' ? ['--no-sandbox'] : []
    });
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
  });

  async function read(page: Page, step: Step) {
    await page.setViewport({ width: 1024, height: 700 });
    const context = await collector.collect(page, step, 0, 15_000);
    if (!context) {
      throw new Error('the page could not be read');
    }
    return context;
  }

  it('picks the moved button by its test hook and clicks it', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(movedButton);
      const context = await read(page, {
        type: 'click',
        selectors: [[recordedPath]]
      });

      expect(context.selectors).toEqual([
        { selector: recordedPath, matches: 0 }
      ]);
      const choice = chooseFallbackCandidate(context);
      if (!choice) {
        throw new Error('no fallback candidate was chosen');
      }
      expect(choice).toMatchObject({
        matchedBy: 'testId',
        value: 'add-to-cart'
      });
      const selector = choice.candidate.selectors[0];
      if (!selector) {
        throw new Error('the candidate has no selector');
      }
      expect(selector).toBe('[data-testid="add-to-cart"]');
      await page.click(selector);
      expect(await page.evaluate('document.body.dataset.clicked')).toBe('yes');
    } finally {
      await page.close();
    }
  });

  it('does not choose when two buttons share the recorded name', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(twinButtons);
      const context = await read(page, {
        type: 'click',
        selectors: [['aria/Add to cart']]
      });
      const named = context.candidates.filter(
        (candidate) => candidate.name === 'Add to cart'
      );

      expect(named).toHaveLength(2);
      expect(named.every((candidate) => candidate.selectors.length > 0)).toBe(
        true
      );
      expect(chooseFallbackCandidate(context)).toBeNull();
    } finally {
      await page.close();
    }
  });
});
