import { Injectable, Logger } from '@nestjs/common';
import { ClickStrategy } from './utils';
import { Page } from 'puppeteer';
import { SharedService } from '../../../../shared/shared.service';

@Injectable()
export class CSSClickStrategy implements ClickStrategy {
  constructor(private sharedService: SharedService) {}

  async clickElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout = 1000,
    preventNavigation = false
  ): Promise<boolean> {
    Logger.log(selector, 'CSSClickStrategy.clickElement');
    const domain = new URL(
      this.sharedService.getProjectDomain(projectName, {
        absolutePath: undefined,
        name: title,
      })
    ).hostname;

    // Ensure the selector is present and visible before proceeding
    await Promise.race([
      page.waitForSelector(selector, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);

    // Determine the click method based on conditions
    // only one page means checking datalayer; two pages mean checking with gtm preview mode
    // if the current page is not the same as the domain, then it's a third-party gateway
    const useNormalClick =
      (await page.browserContext().pages()).length === 1 ||
      !page.url().includes(domain);

    if (preventNavigation) {
      this.preventNavigationOnElement(page, selector);
    }

    if (useNormalClick) {
      return await this.attemptClick(
        page,
        projectName,
        title,
        selector,
        this.normalClick
      );
    } else {
      return await this.attemptClick(
        page,
        projectName,
        title,
        selector,
        this.evaluateClick
      );
    }
  }

  async attemptClick(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    clickMethod: (
      page: Page,
      projectName: string,
      title: string,
      selector: string
    ) => Promise<boolean>
  ) {
    const result = await clickMethod.call(
      this,
      page,
      projectName,
      title,
      selector
    );
    if (!result) {
      // Fallback to the other click method
      return await (clickMethod === this.normalClick
        ? this.evaluateClick
        : this.normalClick
      ).call(this, page, projectName, title, selector);
    }
    return result;
  }

  private async preventNavigationOnElement(page: Page, selector: string) {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.addEventListener('click', (e) => e.preventDefault());
      }
    }, selector);
  }

  private async evaluateClick(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      await Promise.race([
        page.evaluate((sel) => {
          const element = document.querySelector(sel) as HTMLElement;
          element?.click();
        }, selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
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

  private async normalClick(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      await Promise.race([
        page.click(selector, { delay: 100 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
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
