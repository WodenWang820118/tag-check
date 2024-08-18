import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';

@Injectable()
export class PageHoverService {
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
        page.hover(selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      Logger.error(
        error,
        `${PageHoverService.name}.${PageHoverService.prototype.operate.name}`
      );
      return false;
    }
  }
}
