import { Page } from 'puppeteer';
import { SelectorType } from '../action-utilities';

export interface ChangeStrategy {
  changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean>;
}

export class AriaChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    await page.waitForSelector(
      `[aria-label="${selector.replace('aria/', '')}"]`,
      { timeout }
    );
    await page.type(`[aria-label="${selector.replace('aria/', '')}"]`, value);
    return true;
  }
}

export class XpathChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout = 1000
  ): Promise<boolean> {
    await page.waitForXPath(selector.replace('xpath/', ''), { timeout });
    const [input] = await page.$x(selector.replace('xpath/', ''));
    await input.type(value);
    return true;
  }
}

export class PiercingChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    await page.waitForSelector(
      selector.replace(SelectorType.PIERCE + '/', ''),
      { timeout }
    );
    await page.type(selector.replace(SelectorType.PIERCE + '/', ''), value);
    return true;
  }
}

export class CSSChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    await page.waitForSelector(selector, { timeout });
    await page.type(selector, value);
    return true;
  }
}
