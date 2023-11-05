import { Page } from 'puppeteer';
import { SelectorType } from '../action-utilities';
import { Injectable, Logger } from '@nestjs/common';
export interface ChangeStrategy {
  changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean>;
}

@Injectable()
export class AriaChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    // Extract the ARIA attribute and value using regex

    const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
    if (!match) {
      Logger.error(
        'Does not find a aria attribute',
        'AriaChangeStrategy.changeElement'
      );
      return false;
    }

    const ariaAttribute = match[1];
    const ariaValue = match[2];
    const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;

    try {
      await Promise.race([
        page.waitForSelector(constructedSelector, {
          timeout,
          visible: true,
        }),
        page.waitForNavigation({ timeout }),
      ]);

      // Check if the element is a select element
      const isSelect = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element && element.tagName.toLowerCase() === 'select';
      }, constructedSelector);

      if (isSelect) {
        // If it's a select element, use page.select() to change its value
        Logger.log('Selecting an option', 'AriaChangeStrategy.changeElement');
        await page.select(constructedSelector, value);
      } else {
        // Otherwise, use page.type() to type the value
        Logger.log(
          'Typing the input element',
          'AriaChangeStrategy.changeElement'
        );
        await page.type(constructedSelector, value);
      }

      return true;
    } catch (error) {
      Logger.error(error.message, 'AriaChangeStrategy.changeElement');
      throw error;
    }
  }
}

@Injectable()
export class XpathChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout = 1000
  ): Promise<boolean> {
    await Promise.race([
      page.waitForXPath(selector.replace(SelectorType.XPATH + '/', ''), {
        timeout,
        visible: true,
      }),
      page.waitForNavigation({ timeout }),
    ]);

    const [input] = await page.$x(selector.replace('xpath/', ''));
    await input.type(value);
    return true;
  }
}

@Injectable()
export class PiercingChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    await Promise.race([
      page.waitForSelector(selector.replace(SelectorType.PIERCE + '/', ''), {
        timeout,
        visible: true,
      }),
      page.waitForNavigation({ timeout }),
    ]);
    await page.type(selector.replace(SelectorType.PIERCE + '/', ''), value);
    return true;
  }
}

@Injectable()
export class CSSChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    try {
      // it could be a navigation before awaiting the selector
      await Promise.race([
        page.waitForSelector(selector, { timeout, visible: true }),
        page.waitForNavigation({ timeout }),
      ]);

      // Check if the element is a select element
      const isSelect = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element && element.tagName.toLowerCase() === 'select';
      }, selector);

      if (isSelect) {
        // If it's a select element, use page.select() to change its value
        Logger.log('Select an element', 'CSSChangeStrategy.changeElement');
        await page.select(selector, value);
      } else {
        // Otherwise, use page.type() to type the value
        Logger.log(
          'Typing the input element',
          'CSSChangeStrategy.changeElement'
        );
        await page.type(selector, value);
      }

      return true;
    } catch (error) {
      Logger.error(error.message, 'CSSChangeStrategy.changeElement');
      throw error;
    }
  }
}
