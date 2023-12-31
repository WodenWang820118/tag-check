import { Injectable, Logger, HttpException } from '@nestjs/common';
import { Page } from 'puppeteer';
import { UtilitiesService } from '../../utilities/utilities.service';
import { getSelectorType } from '../action-utils';
import { ActionHandler, getFirstSelector } from './utils';
import { ProjectService } from '../../../shared/project/project.service';
import { SharedService } from '../../../shared/shared.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
@Injectable()
export class ClickHandler implements ActionHandler {
  constructor(
    private utilitiesService: UtilitiesService,
    private projectService: ProjectService,
    private sharedService: SharedService,
    private clickStrategyService: ClickStrategyService
  ) {}

  async handle(
    page: Page,
    projectName: string,
    title: string,
    step: any,
    isLastStep: boolean
  ): Promise<void> {
    // Logic of handleClick
    let clickedSuccessfully = false;
    // TODO: typing issue
    const preventNavigationEvents = (
      (await this.projectService.getSettings()) as any
    ).preventNavigationEvents;
    let preventNavigation = false;

    for (const selector of step.selectors) {
      // try {
      //   await this.utilitiesService.scrollIntoViewIfNeeded(
      //     Array.isArray(selector) ? selector : [selector],
      //     page,
      //     500
      //   );
      // } catch (error) {
      //   Logger.error(error.mssage, 'Utilities.scrollIntoViewIfNeeded');
      // }

      if (
        step.type === 'click' &&
        preventNavigationEvents.includes(title) &&
        isLastStep
      )
        preventNavigation = true;

      if (
        await this.clickElement(
          page,
          projectName,
          title,
          getFirstSelector(selector),
          5000,
          preventNavigation
        )
      ) {
        clickedSuccessfully = true;
        Logger.log(getFirstSelector(selector), 'ClickHandler.handle');
        break; // Exit the loop as soon as one selector works
      }
    }

    if (!clickedSuccessfully) {
      throw new HttpException(
        `Failed to click. None of the selectors worked for action ${step.target}`,
        500
      );
    }
  }

  async clickElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout = 3000,
    preventNavigation = false
  ): Promise<boolean> {
    const domain = new URL(
      await this.sharedService.getProjectDomain(projectName, {
        absolutePath: undefined,
        name: title,
      })
    ).hostname;

    try {
      await page.waitForNavigation({ timeout: 3000 });
    } catch (error) {
      Logger.log('No navigation needed', 'ClickHandler.clickElement');
    }

    await page.waitForSelector(selector, { timeout, visible: true });

    // Determine the click method based on conditions
    // only one page means checking datalayer; two pages mean checking with gtm preview mode
    // if the current page is not the same as the domain, then it's a third-party gateway
    const useNormalClick =
      (await page.browserContext().pages()).length === 1 ||
      !page.url().includes(domain);

    if (preventNavigation) {
      this.preventNavigationOnElement(page, selector);
    }

    try {
      // low timeout may cause the click to fail
      return await this.clickStrategyService.clickElement(
        page,
        projectName,
        title,
        selector,
        getSelectorType(selector),
        useNormalClick,
        timeout
      );
    } catch (error) {
      Logger.error(error.message, 'ClickHandler.clickElement');
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
}
