import { Injectable, Logger } from '@nestjs/common';
import { ClickStrategy } from './utils';
import { Page } from 'puppeteer';

@Injectable()
export class CSSClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000,
    preventNavigation = false
  ): Promise<boolean> {
    Logger.log(selector, 'CSSClickStrategy.clickElement');

    // Ensure the selector is present before proceeding
    // it could be a navigation before awaiting the selector
    await Promise.race([
      page.waitForSelector(selector, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);

    // Add navigation prevention if required
    if (preventNavigation) {
      this.preventNavigationOnElement(page, selector);
      // the normal click cannot get the dataLayer's data such as select_item
      return this.evaluateClick(page, selector);
    } else {
      const result = await this.normalClick(page, selector);
      if (!result) {
        return await this.evaluateClick(page, selector);
      } else {
        return result;
      }
    }
  }

  private async preventNavigationOnElement(page: Page, selector: string) {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.addEventListener('click', (e) => e.preventDefault());
      }
    }, selector);
  }

  private async evaluateClick(page: Page, selector: string): Promise<boolean> {
    try {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel) as HTMLElement;
        element?.click();
      }, selector);
      Logger.log(
        `Clicked using page.evaluate for selector: ${selector}`,
        'CSSClickStrategy.clickElement'
      );
      return true;
    } catch (error) {
      Logger.error(error.message, 'CSSClickStrategy.evaluateClick');
      return false;
    }
  }

  private async normalClick(page: Page, selector: string): Promise<boolean> {
    try {
      // await page.focus(selector);
      await page.click(selector, { delay: 100 });
      Logger.log(
        `Clicked using page.click for selector: ${selector}`,
        'CSSClickStrategy.clickElement'
      );
      return true;
    } catch (error) {
      Logger.error(error.message, 'CSSClickStrategy.clickElement');
      return false;
    }
  }
}
