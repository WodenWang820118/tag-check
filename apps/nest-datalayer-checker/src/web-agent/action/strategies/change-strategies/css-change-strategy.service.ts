import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ChangeStrategy } from './utils';

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
