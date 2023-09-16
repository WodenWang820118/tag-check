import { Page, ElementHandle } from 'puppeteer';
import { SelectorType, queryShadowDom, sleep } from '../action-utilities';

export interface ClickStrategy {
  clickElement(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<boolean>;
}

export class CSSClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    await page.waitForSelector(selector, { timeout });
    await page.focus(selector);
    await sleep(1000); // for future recording purpose
    await page.click(selector, { delay: 1000 });
    return true;
  }
}

export class XPathClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    const xpath = selector.replace(SelectorType.XPATH + '/', '');
    await page.waitForXPath(xpath, { timeout });
    const [element] = await page.$x(xpath);
    if (isElementHandle(element)) {
      await element.focus();
      await element.click({
        delay: 1000,
      });
      return true;
    }
    return false;
  }
}

export class PierceClickStrategy implements ClickStrategy {
  async clickElement(
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
      await elementHandle.click({ delay: 1000 });
      return true;
    }
    return false;
  }
}

export class TextClickStrategy implements ClickStrategy {
  async clickElement(
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
      await element.click({
        delay: 1000,
      });
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