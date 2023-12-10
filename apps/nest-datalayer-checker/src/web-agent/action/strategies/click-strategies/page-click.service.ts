import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ClickOperation } from './utils';

@Injectable()
export class PageClickService implements ClickOperation {
  async operate(
    page: Page,
    projectName: string,
    title: string,
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
      Logger.error(error.message, 'PageClickService.operate');
      return false;
    }
  }
}
