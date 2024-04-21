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
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';

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
    eventId: string,
    state: any,
    isLastStep: boolean,
    application?: EventInspectionPresetDto['application']
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
          eventId,
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
            eventId,
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
    eventId: string,
    isLastStep: boolean,
    delay: number
  ) {
    await sleep(delay);
    await this.handlers[step.type].handle(
      page,
      projectName,
      eventId,
      step,
      isLastStep
    );
    await handleNavigationIfNeeded(page, isLastStep);
    await this.dataLayerService.updateSelfDataLayer(page, projectName, eventId);
  }
}
