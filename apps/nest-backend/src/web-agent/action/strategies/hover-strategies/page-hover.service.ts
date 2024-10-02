import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';

@Injectable()
export class PageHoverService {
  private readonly logger = new Logger(PageHoverService.name);
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
      this.logger.error(
        `Failed to hover on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
