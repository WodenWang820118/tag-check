import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ClickOperation } from './utils';

@Injectable()
export class PageClickService implements ClickOperation {
  private readonly logger = new Logger(PageClickService.name);
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      await Promise.race([
        page.click(selector, { delay: 100 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to click on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
