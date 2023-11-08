import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ChangeStrategy } from './utils';

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
