import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ClickOperation } from './utils';
import { withTimeout } from '../with-timeout';

/** Clicks with page.click(): a real mouse click at the element's position. */
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
      await withTimeout(
        page.click(selector, { delay: 100 }),
        timeout,
        'Timeout exceeded Page Clicking'
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to click on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
