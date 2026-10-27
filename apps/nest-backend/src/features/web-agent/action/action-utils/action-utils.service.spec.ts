import { describe, expect, it, vi } from 'vitest';
import { ActionUtilsService } from './action-utils.service';

describe('ActionUtilsService', () => {
  it('uses Puppeteer text query handler syntax when resolving text selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'text/Checkout';

    await service.getElement(
      page as never,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('text/Checkout');
    expect(page.$).not.toHaveBeenCalledWith('text=Checkout');
  });

  it('treats unprefixed selectors as CSS selectors', () => {
    const service = new ActionUtilsService();

    expect(service.getSelectorType('Checkout')).toBe('css');
  });

  it('treats CSS selectors that start like a query handler name as CSS', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'textarea.comment';

    expect(service.getSelectorType(selector)).toBe('css');
    await service.getElement(
      page as never,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('textarea.comment');
  });

  it('adds the Puppeteer text query handler prefix when text type is explicit', async () => {
    const page = createPage();
    const service = new ActionUtilsService();

    await service.getElement(page as never, 'text', 'Checkout');

    expect(page.$).toHaveBeenCalledWith('text/Checkout');
  });

  it('uses Puppeteer XPath query handler syntax instead of CSS lookup', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'xpath/.//button';

    await service.getElement(
      page as never,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('xpath/.//button');
    expect(page.$$).not.toHaveBeenCalled();
  });

  it('detects raw XPath selectors before CSS class selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = './/button';

    await service.getElement(
      page as never,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('xpath/.//button');
    expect(page.$$).not.toHaveBeenCalled();
  });

  it('preserves legacy aria attribute selector compatibility', async () => {
    const page = createPage();
    const service = new ActionUtilsService();

    await service.getElement(page as never, 'aria', 'aria/aria-label/Checkout');

    expect(page.$).toHaveBeenCalledWith('[aria-label="Checkout"]');
  });

  it('uses Puppeteer aria query handler syntax for native aria selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'aria/Checkout';

    await service.getElement(
      page as never,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('aria/Checkout');
  });

  it('adds the Puppeteer aria query handler prefix for raw aria selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();

    await service.getElement(page as never, 'aria', 'Checkout');

    expect(page.$).toHaveBeenCalledWith('aria/Checkout');
  });

  it('preserves legacy pierce host and shadow child lookup', async () => {
    const element = {};
    const jsHandle = {
      asElement: vi.fn(() => element),
      dispose: vi.fn()
    };
    const page = createPage();
    page.evaluateHandle.mockResolvedValue(jsHandle);
    const service = new ActionUtilsService();
    const selector = 'pierce/#host/.shadow-button';

    const result = await service.getElement(
      page as never,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(result).toBe(element);
    const source: unknown = page.evaluateHandle.mock.calls[0]?.[0];
    if (typeof source !== 'string') {
      throw new Error('Expected the pierce lookup to be a source string');
    }
    expect(source).toContain('"#host"');
    expect(source).toContain('".shadow-button"');
    expect(page.$).not.toHaveBeenCalled();
  });

  it('resolves a shadow chain with the CSS query', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'my-widget >>>> button.buy';

    expect(service.getSelectorType(selector)).toBe('css');
    await service.getElement(page as never, 'css', selector);

    expect(page.$).toHaveBeenCalledWith(selector);
  });

  it('classifies a converted chain as CSS rather than its first prefix', () => {
    const service = new ActionUtilsService();

    expect(service.getSelectorType('::-p-aria(Buy) >>>> button')).toBe('css');
    expect(service.getSelectorType('::-p-xpath(//button) >>>> span')).toBe(
      'css'
    );
    expect(service.getSelectorType('::-p-text(Hello)')).toBe('css');
    expect(service.getSelectorType(':scope >>> .buy >>>> span')).toBe('css');
    expect(service.getSelectorType('text/Hello >>>> span')).toBe('css');
    expect(service.getSelectorType('aria/Buy >>>> span')).toBe('css');
    expect(service.getSelectorType('pierce/div >>>> span')).toBe('css');
    expect(service.getSelectorType('xpath//div >>>> span')).toBe('css');
    expect(service.getSelectorType('.//button >>>> span')).toBe('css');
  });
});

function createPage() {
  return {
    $: vi.fn().mockResolvedValue({}),
    $$: vi.fn().mockResolvedValue([]),
    evaluateHandle: vi.fn()
  };
}
