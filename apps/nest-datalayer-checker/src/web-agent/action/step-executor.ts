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
      await handler.handle(page, projectName, testName, step, isLastStep);

      // some actions may trigger navigation, so we need to wait for the navigation to complete
      Logger.log(`isLastStep: ${isLastStep}`, 'StepExecutor.executeStep');
      if (isLastStep) {
        try {
          await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 10000,
          });
        } catch (error) {
          Logger.log('no navigation needed', 'StepExecutor.executeStep');
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
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
    } else if (step.type === BrowserAction.KEYDOWN) {
      Logger.log(`keydown ${step.key}`, 'StepExecutor.executeStep');
      await page.keyboard.down(step.key);
    } else if (step.type === BrowserAction.KEYUP) {
      Logger.log(`keyup ${step.key}`, 'StepExecutor.executeStep');

      // only a pair of keydown and keyup can trigger the website action
      await page.keyboard.up(step.key);

      // when the keyboard action completes, we may need to wait for the navigation to complete
      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 5000,
        });
      } catch (error) {
        Logger.log('no navigation needed', 'StepExecutor.executeStep');
      }
      // necessary delay for the website to update the data layer
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        testName
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

        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
        } catch (error) {
          Logger.log('no navigation', 'StepExecutor.handleWaitForElement');
        }
        try {
          await page.waitForSelector(selector, {
            visible: step.visible ? true : false,
            timeout: timeout,
          });
        } catch (error) {
          Logger.log('no selector', 'StepExecutor.handleWaitForElement');
        }

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
        await page.close();
        throw new HttpException(`${error.message}, Stop processing.`, 500);
      }
    }
  }
}
