import { Injectable, Logger, HttpException } from '@nestjs/common';
import { Page } from 'puppeteer';
import { UtilitiesService } from '../../utilities/utilities.service';
import { getSelectorType } from '../action-utils';
import { ActionHandler, getFirstSelector } from './utils';
import { ProjectService } from '../../../os/project/project.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { FilePathService } from '../../../os/path/file-path/file-path.service';
import { FileService } from '../../../os/file/file.service';
import { extractEventNameFromId } from '@utils';
@Injectable()
export class ClickHandler implements ActionHandler {
  constructor(
    private utilitiesService: UtilitiesService,
    private projectService: ProjectService,
    private fileService: FileService,
    private filePathService: FilePathService,
    private clickStrategyService: ClickStrategyService
  ) {}

  async handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: any,
    isLastStep: boolean
  ): Promise<void> {
    // Logic of handleClick
    let clickedSuccessfully = false;
    // TODO: typing issue
    const preventNavigationEvents = (
      (await this.projectService.getProjectSettings(projectName)) as any
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
      const title = extractEventNameFromId(eventId);
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
          eventId,
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
    eventId: string,
    selector: string,
    timeout = 3000,
    preventNavigation: boolean
  ): Promise<boolean> {
    const operationPath = await this.filePathService.getOperationFilePath(
      projectName,
      eventId
    );

    const domain = new URL(
      await this.fileService.readJsonFile(operationPath).steps[1].url
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
        eventId,
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
    Logger.log(selector, 'ClickHandler.preventNavigationOnElement');
    await page.evaluate((sel) => {
      const isDescendant = (parent, child) => {
        let node = child.parentNode;
        while (node != null) {
          if (node === parent) {
            return true;
          }
          node = node.parentNode;
        }
        return false;
      };

      const elements = document.querySelectorAll(sel);
      if (elements) {
        elements.forEach((elem) =>
          elem.addEventListener('click', (e) => {
            const target = e.target;
            // Check if the target is the element itself or a descendant of the element
            if (target === elem || isDescendant(elem, target)) {
              e.preventDefault();
            }
          })
        );
      }
    }, selector);
  }
}
