import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { withTimeout } from '../with-timeout';

/**
 * Hovers with page.hover(). Resolves true once the mouse is over the
 * element, false when it failed or timed out; it does not throw.
 */
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
      await withTimeout(page.hover(selector), timeout, 'Timeout exceeded');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to hover on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
