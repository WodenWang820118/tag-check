import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { BrowserAction, sleep } from './action-utils';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { ActionHandler } from './handlers/utils';
import {
  handleKeyboardAction,
  handleNavigate,
  handleNavigationIfNeeded,
  handleSetViewport,
  handleWaitForElement,
} from './step-executor-utils';
import { InspectEventDto } from '../../dto/inspect-event.dto';

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
    isLastStep: boolean,
    application?: InspectEventDto['application']
  ) {
    const randomDelay = 3000 + Math.floor(Math.random() * 2000);
    const handler = this.handlers[step.type];

    switch (step.type) {
      case BrowserAction.SETVIEWPORT:
        await handleSetViewport(page, step);
        break;
      case BrowserAction.NAVIGATE:
        await handleNavigate(page, step, state, application);
        break;
      case BrowserAction.WAITFORELEMENT:
        await handleWaitForElement(page, step, step.timeout || 10000);
        break;
      case BrowserAction.KEYDOWN:
        Logger.log(`${step.type} ${step.key}`, 'StepExecutor.executeStep');
        await page.keyboard.down(step.key);
        break;
      case BrowserAction.KEYUP:
        Logger.log(`${step.type} ${step.key}`, 'StepExecutor.executeStep');
        await page.keyboard.up(step.key);
        await handleKeyboardAction(
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
    await handleNavigationIfNeeded(page, isLastStep);
    await this.dataLayerService.updateSelfDataLayer(
      page,
      projectName,
      testName
    );
  }
}
