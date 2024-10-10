import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ChangeOperation } from './utils';

@Injectable()
export class PageChangeService implements ChangeOperation {
  private readonly logger = new Logger(PageChangeService.name);
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
      if (!value) {
        this.logger.error('Value is required to change the element');
        return false;
      }

      const isSelect = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element && element.tagName.toLowerCase() === 'select';
      }, selector);

      if (isSelect) {
        // If it's a select element, use page.select() to change its value
        this.logger.log('Selecting the select element');
        await Promise.race([
          page.select(selector, value),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
          ),
        ]);
      } else {
        this.logger.log('Typing the input element');
        await Promise.race([
          page.type(selector, value),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
          ),
        ]);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
