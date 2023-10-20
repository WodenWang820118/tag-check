import { Page, ElementHandle } from 'puppeteer';
import { SelectorType, queryShadowDom, sleep } from '../action-utilities';
import { Logger } from '@nestjs/common';

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
    Logger.log(`${selector}`, 'CSSClickStrategy');
    try {
      await page.waitForSelector(selector, { timeout });
      await page.focus(selector);
      await page.click(selector, { delay: 1000 });
      Logger.log('Clicked using page.click');
    } catch (error) {
      Logger.error(error.message, 'Error with page.click');
      Logger.log('Trying with page.evaluate');

      try {
        // use wait for navigation to wait for the page to load
        // otherwise, error will be thrown
        await Promise.all([
          page.evaluate((sel) => {
            const element = document.querySelector(sel) as HTMLElement;
            if (!element) {
              throw new Error(`No element found for selector: ${sel}`);
            }
            element.click();
          }, selector),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);
        Logger.log('Clicked using page.evaluate');
      } catch (evaluateError) {
        Logger.error(evaluateError.message, 'Error with page.evaluate');
        return false;
      }
    }
    return true;
  }
}

export class XPathClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    Logger.log(`${selector}`, 'XPathClickStrategy');
    const xpath = selector.replace(SelectorType.XPATH + '/', '');

    try {
      await page.waitForXPath(xpath, { timeout });
      const [element] = await page.$x(xpath);
      if (isElementHandle(element)) {
        await element.focus();
        await element.click({ delay: 1000 });
        return true;
      }
      throw new Error('Element not found with XPath');
    } catch (error) {
      Logger.error(`Error in XPathClickStrategy: ${error.message}`, 'Error');
      return false;
    }
  }
}

export class PierceClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    Logger.log(`${selector}`, 'PierceClickStrategy');

    try {
      const elementHandle = await queryShadowDom(
        page,
        ...selector.replace(SelectorType.PIERCE + '/', '').split('/'),
        { timeout }
      );
      if (isElementHandle(elementHandle)) {
        await elementHandle.click({ delay: 1000 });
        return true;
      }
      throw new Error('Element not found with Pierce selector');
    } catch (error) {
      Logger.error(`${error.message}`, 'Error in PierceClickStrategy');
      return false;
    }
  }
}

export class TextClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    Logger.log(`${selector}`, 'TextClickStrategy');
    const xpath = `//*[text()="${selector.replace(
      SelectorType.TEXT + '/',
      ''
    )}"]`;

    try {
      await page.waitForXPath(xpath, { timeout });
      const [element] = await page.$x(xpath);
      if (isElementHandle(element)) {
        await element.click({ delay: 1000 });
        return true;
      }
      throw new Error('Element not found with Text selector');
    } catch (error) {
      Logger.log(`${error.message}`, 'Error in TextClickStrategy');
      return false;
    }
  }
}

function isElementHandle(obj: any): obj is ElementHandle<Element> {
  return (
    obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
  );
}
