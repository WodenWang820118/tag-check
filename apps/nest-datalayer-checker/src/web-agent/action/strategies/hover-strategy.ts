import { Page, ElementHandle } from 'puppeteer';
import { SelectorType, queryShadowDom, sleep } from '../action-utilities';

// TODO: use @Injectable and modules

export interface HoverStrategy {
  hoverElement(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<boolean>;
}

export class CSSHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    await page.waitForSelector(selector, { timeout });
    await sleep(1000); // for future recording purpose
    await page.hover(selector);
    return true;
  }
}

export class XPathHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    const xpath = selector.replace(SelectorType.XPATH + '/', '');
    await page.waitForXPath(xpath, { timeout });
    const [element] = await page.$x(xpath);
    if (isElementHandle(element)) {
      await element.hover();
      return true;
    }
    return false;
  }
}

export class AriaHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    // Extract the ARIA attribute and value using regex
    const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid selector format');
    }

    const ariaAttribute = match[1];
    const ariaValue = match[2];
    const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;

    try {
      await page.waitForSelector(constructedSelector, { timeout });
      const element = await page.$(constructedSelector);
      if (element) {
        await element.hover();
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `Failed to hover over element with selector: ${constructedSelector}. Error: ${error}`
      );
      return false;
    }
  }
}

export class PierceHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    const elementHandle = await queryShadowDom(
      page,
      ...selector.replace(SelectorType.PIERCE + '/', '').split('/'),
      { timeout }
    );
    if (isElementHandle(elementHandle)) {
      await elementHandle.hover();
      return true;
    }
    return false;
  }
}

export class TextHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    const xpath = `//*[text()="${selector.replace(
      SelectorType.TEXT + '/',
      ''
    )}"]`;
    await page.waitForXPath(xpath, { timeout });
    const [element] = await page.$x(xpath);
    if (isElementHandle(element)) {
      await element.hover();
      return true;
    }
    return false;
  }
}

function isElementHandle(obj: any): obj is ElementHandle<Element> {
  return (
    obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
  );
}
