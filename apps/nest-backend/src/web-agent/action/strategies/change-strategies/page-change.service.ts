import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ChangeOperation } from './utils';

@Injectable()
export class PageChangeService implements ChangeOperation {
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      // TODO: verifiy this
      // Check if the element is a select element
      const isSelect = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element && element.tagName.toLowerCase() === 'select';
      }, selector);

      if (isSelect) {
        // If it's a select element, use page.select() to change its value
        Logger.log('Select an element', 'PageChangeStrategy.operate');
        await Promise.race([
          page.select(selector, value),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
          ),
        ]);
      } else {
        // Otherwise, use page.type() to type the value
        Logger.log('Typing the input element', 'PageChangeStrategy.operate');
        await Promise.race([
          page.type(selector, value),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
          ),
        ]);
      }

      return true;
    } catch (error) {
      Logger.error(error.message, 'PageChangeService.operate');
      return false;
    }
  }
}
