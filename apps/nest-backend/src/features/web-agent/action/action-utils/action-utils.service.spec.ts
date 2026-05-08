import { describe, expect, it, vi } from 'vitest';
import { ActionUtilsService } from './action-utils.service';

describe('ActionUtilsService', () => {
  it('uses Puppeteer text query handler syntax when resolving text selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'text/Checkout';

    await service.getElement(
      page as any,
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

  it('adds the Puppeteer text query handler prefix when text type is explicit', async () => {
    const page = createPage();
    const service = new ActionUtilsService();

    await service.getElement(page as any, 'text', 'Checkout');

    expect(page.$).toHaveBeenCalledWith('text/Checkout');
  });

  it('uses Puppeteer XPath query handler syntax instead of CSS lookup', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'xpath/.//button';

    await service.getElement(
      page as any,
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
      page as any,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('xpath/.//button');
    expect(page.$$).not.toHaveBeenCalled();
  });

  it('preserves legacy aria attribute selector compatibility', async () => {
    const page = createPage();
    const service = new ActionUtilsService();

    await service.getElement(page as any, 'aria', 'aria/aria-label/Checkout');

    expect(page.$).toHaveBeenCalledWith('[aria-label="Checkout"]');
  });

  it('uses Puppeteer aria query handler syntax for native aria selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();
    const selector = 'aria/Checkout';

    await service.getElement(
      page as any,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(page.$).toHaveBeenCalledWith('aria/Checkout');
  });

  it('adds the Puppeteer aria query handler prefix for raw aria selectors', async () => {
    const page = createPage();
    const service = new ActionUtilsService();

    await service.getElement(page as any, 'aria', 'Checkout');

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
      page as any,
      service.getSelectorType(selector) ?? '',
      selector
    );

    expect(result).toBe(element);
    expect(page.evaluateHandle).toHaveBeenCalledWith(
      expect.any(Function),
      '#host',
      '.shadow-button'
    );
    expect(page.$).not.toHaveBeenCalled();
  });
});

function createPage() {
  return {
    $: vi.fn().mockResolvedValue({}),
    $$: vi.fn().mockResolvedValue([]),
    evaluateHandle: vi.fn()
  };
}
