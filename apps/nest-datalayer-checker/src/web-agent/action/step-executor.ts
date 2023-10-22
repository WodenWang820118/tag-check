import { Logger } from '@nestjs/common';
import { ActionHandler } from './action-handlers';
import { Page } from 'puppeteer';
import { BrowserAction, sleep } from './action-utilities';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';

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
    state: any
  ) {
    const randomDelay = 3000 + Math.floor(Math.random() * 2000);
    const handler = this.handlers[step.type];
    if (handler) {
      await sleep(randomDelay);
      await handler.handle(page, step);
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
}
