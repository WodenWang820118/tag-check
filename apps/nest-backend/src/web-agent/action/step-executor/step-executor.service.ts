import { Inject, Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { BrowserAction, sleep } from '../action-utils';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { ACTION_HANDLERS, ActionHandler } from '..//handlers/utils';
import { StepExecutorUtilsService } from './step-executor-utils.service';
import { EventInspectionPresetDto } from '../../../dto/event-inspection-preset.dto';

@Injectable()
export class StepExecutorService {
  constructor(
    @Inject(ACTION_HANDLERS) private handlers: { [key: string]: ActionHandler },
    private dataLayerService: DataLayerService,
    private stepExecutorUtilsService: StepExecutorUtilsService
  ) {}

  async executeStep(
    page: Page,
    step: any,
    projectSlug: string,
    eventId: string,
    state: any,
    isLastStep: boolean,
    application: EventInspectionPresetDto['application']
  ) {
    const randomDelay = 3000 + Math.floor(Math.random() * 2000);

    switch (step.type) {
      case BrowserAction.SETVIEWPORT:
        await this.stepExecutorUtilsService.handleSetViewport(page, step);
        Logger.log(
          'Handle Viewport Successfully',
          `${StepExecutorService.name}.${StepExecutorService.prototype.executeStep.name}`
        );
        break;
      case BrowserAction.NAVIGATE:
        await this.stepExecutorUtilsService.handleNavigate(
          page,
          step,
          state,
          application
        );

        Logger.log(
          'Handle Navigation Successfully',
          `${StepExecutorService.name}.${StepExecutorService.prototype.executeStep.name}`
        );
        break;
      case BrowserAction.WAITFORELEMENT:
        await this.stepExecutorUtilsService.handleWaitForElement(
          page,
          step,
          step.timeout || 10000
        );
        Logger.log(
          'Handle Wait for element Successfully',
          `${StepExecutorService.name}.${StepExecutorService.prototype.executeStep.name}`
        );
        break;
      case BrowserAction.KEYDOWN:
        Logger.log(`${step.type} ${step.key}`, 'StepExecutor.executeStep');
        await page.keyboard.down(step.key);
        break;
      case BrowserAction.KEYUP:
        Logger.log(`${step.type} ${step.key}`, 'StepExecutor.executeStep');
        await page.keyboard.up(step.key);
        await this.stepExecutorUtilsService.handleKeyboardAction(
          page,
          projectSlug,
          eventId,
          isLastStep,
          randomDelay
        );
        break;
      default:
        if (this.handlers) {
          await this.handleDefaultAction(
            page,
            step,
            projectSlug,
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
    if (
      this.handlers[step.type] &&
      typeof this.handlers[step.type].handle === 'function'
    ) {
      await this.handlers[step.type].handle(
        page,
        projectName,
        eventId,
        step,
        isLastStep
      );
      await this.stepExecutorUtilsService.handleNavigationIfNeeded(
        page,
        isLastStep
      );
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        eventId
      );
    } else {
      Logger.warn(
        `Handler for action type ${step.type} is not properly defined`
      );
    }
  }
}
