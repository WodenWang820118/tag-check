import { Page } from 'puppeteer';
import { SelectorType } from '../action-utilities';
import { Logger } from '@nestjs/common';

// TODO: use @Injectable and modules
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
    // Extract the ARIA attribute and value using regex

    await page.waitForSelector(selector, { timeout });

    const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid selector format');
    }

    const ariaAttribute = match[1];
    const ariaValue = match[2];
    const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;

    try {
      // await page.waitForSelector(constructedSelector, { timeout });

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
    try {
      await page.waitForSelector(selector, { timeout });

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
