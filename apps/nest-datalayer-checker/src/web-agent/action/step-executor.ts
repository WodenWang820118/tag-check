import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { BrowserAction, sleep } from './action-utils';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { ActionHandler } from './handlers/utils';

@Injectable()
export class StepExecutor {
  constructor(
    private handlers: { [key: string]: ActionHandler },
    private dataLayerService: DataLayerService
  ) {}

  async executeStep(
    page: Page,
    step: any,
    projectName: string,
    testName: string,
    state: any,
    isLastStep: boolean
  ) {
    const randomDelay = 3000 + Math.floor(Math.random() * 2000);
    const handler = this.handlers[step.type];

    if (handler) {
      await sleep(randomDelay);
      // TODO: how to delay navigation caused by click that dataLayer shows before navigation?
      // TODO: try get dataLayer before navigation, if found, then don't wait for navigation
      // it should be done in the handlers
      await handler.handle(page, testName, step, isLastStep);
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        testName
      );
    } else if (step.type === BrowserAction.SETVIEWPORT) {
      await this.handleSetViewport(page, step);
    } else if (step.type === BrowserAction.NAVIGATE) {
      await sleep(randomDelay + Math.random());
      await this.handleNavigate(page, step, state);
    } else if (step.type === BrowserAction.WAITFORELEMENT) {
      await this.handleWaitForElement(
        page,
        step,
        step.timeout ? step.timeout : 5000
      );
    } else {
      Logger.warn(`Unknown action type: ${step.type}`);
    }
  }

  async handleSetViewport(page: Page, step: any) {
    await page.setViewport({
      width: step.width,
      height: step.height,
    });
  }

  async handleNavigate(page: Page, step: any, state: any) {
    await page.goto(step.url, { waitUntil: 'networkidle2' });

    if (state.isFirstNavigation) {
      // only reload the landing page, trying to skip the overlay
      await page.reload({
        waitUntil: 'networkidle2',
      });
      state.isFirstNavigation = false;
    }
  }

  async handleWaitForElement(page: Page, step: any, timeout: number) {
    for (const selector of step.selectors) {
      try {
        // sometimes SSR may send multiple SPA pages, so it's necessary to wait for navigation
        // but sometimes it's not necessary, so we do race
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout }),
          page.waitForSelector(selector, {
            visible: step.visible ? true : false,
            timeout: timeout,
          }),
        ]);

        Logger.log(
          `${selector} is visible`,
          'StepExecutor.handleWaitForElement'
        );
        return;
      } catch (error) {
        Logger.log(
          `${selector} is invisible`,
          'StepExecutor.handleWaitForElement'
        );
        Logger.error(error.message, 'StepExecutor.handleWaitForElement');
        // close the page if stop processing
        // await page.close();
        throw new HttpException(`${error.message}, Stop processing.`, 500);
      }
    }
  }
}
