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

    switch (step.type) {
      case BrowserAction.SETVIEWPORT:
        await this.handleSetViewport(page, step);
        break;
      case BrowserAction.NAVIGATE:
        await this.handleNavigate(page, step, state);
        break;
      case BrowserAction.WAITFORELEMENT:
        await this.handleWaitForElement(page, step, step.timeout || 5000);
        break;
      case BrowserAction.KEYDOWN:
        Logger.log(`${step.type} ${step.key}`, 'StepExecutor.executeStep');
        await page.keyboard.down(step.key);
        break;
      case BrowserAction.KEYUP:
        Logger.log(`${step.type} ${step.key}`, 'StepExecutor.executeStep');
        await page.keyboard.up(step.key);
        await this.handleKeyboardAction(
          page,
          projectName,
          testName,
          isLastStep,
          randomDelay
        );
        break;
      default:
        if (handler) {
          await this.handleDefaultAction(
            page,
            step,
            projectName,
            testName,
            isLastStep,
            randomDelay
          );
        } else {
          Logger.warn(`Unknown action type: ${step.type}`);
        }
        break;
    }
  }

  async handleDefaultAction(
    page: Page,
    step: any,
    projectName: string,
    testName: string,
    isLastStep: boolean,
    delay: number
  ) {
    await sleep(delay);
    await this.handlers[step.type].handle(
      page,
      projectName,
      testName,
      step,
      isLastStep
    );
    await this.handleNavigationIfNeeded(page, isLastStep);
    await this.dataLayerService.updateSelfDataLayer(
      page,
      projectName,
      testName
    );
  }

  async handleKeyboardAction(
    page: Page,
    projectName: string,
    testName: string,
    isLastStep: boolean,
    delay: number
  ) {
    await this.handleNavigationIfNeeded(page, isLastStep, delay);
    await this.dataLayerService.updateSelfDataLayer(
      page,
      projectName,
      testName
    );
  }

  async handleNavigationIfNeeded(
    page: Page,
    isLastStep: boolean,
    delay = 10000
  ) {
    if (isLastStep) {
      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: delay,
        });
      } catch (error) {
        Logger.log('No navigation needed', 'StepExecutor.executeStep');
      }
    }
    await sleep(1000); // Necessary delay for the website to update
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
