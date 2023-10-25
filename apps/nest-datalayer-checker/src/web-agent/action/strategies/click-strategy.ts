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
    Logger.log(selector, 'CSSClickStrategy.clickElement');
    try {
      await page.waitForSelector(selector, { timeout });
      await page.focus(selector);
      await page.click(selector, { delay: 1000 });
      Logger.log('Clicked using page.click', 'CSSClickStrategy.clickElement');
    } catch (error) {
      Logger.error(error.message, 'CSSClickStrategy.clickElement');
      Logger.log(
        `page.evaluate click: ${selector}`,
        'CSSClickStrategy.clickElement'
      );

      try {
        // use wait for navigation to wait for the page to load
        // otherwise, error will be thrown
        await Promise.all([
          page.evaluate((sel) => {
            const element = document.querySelector(sel) as HTMLElement;
            if (!element) {
              Logger.error(
                `No element found for selector: ${sel}`,
                'CSSClickStrategy.clickElement'
              );
            }
            element.click();
          }, selector),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);
      } catch (evaluateError) {
        Logger.error(evaluateError.message, 'CSSClickStrategy.clickElement');
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
    Logger.log(`${selector}`, 'XPathClickStrategy.clickElement');
    const xpath = selector.replace(SelectorType.XPATH + '/', '');

    try {
      await page.waitForXPath(xpath, { timeout });
      const [element] = await page.$x(xpath);
      if (isElementHandle(element)) {
        await element.focus();
        await element.click({ delay: 1000 });
        return true;
      }
    } catch (error) {
      Logger.error(`${error.message}`, 'XPathClickStrategy.clickElement');
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
    Logger.log(`${selector}`, 'PierceClickStrategy.clickElement');

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
    } catch (error) {
      Logger.error(`${error.message}`, 'PierceClickStrategy.clickElement');
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
    Logger.log(`${selector}`, 'TextClickStrategy.clickElement');
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
    } catch (error) {
      Logger.log(`${error.message}`, 'TextClickStrategy.clickElement');
      return false;
    }
  }
}

function isElementHandle(obj: any): obj is ElementHandle<Element> {
  return (
    obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
  );
}
