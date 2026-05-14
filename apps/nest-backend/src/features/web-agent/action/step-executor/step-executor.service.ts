import { Inject, Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { ACTION_HANDLERS, ActionHandler } from '..//handlers/utils';
import { StepExecutorUtilsService } from './step-executor-utils.service';
import { EventInspectionPresetDto } from '../../../../shared/dto/event-inspection-preset.dto';
import { Step } from '@utils';
import { BrowserAction } from '../action-utils';

@Injectable()
export class StepExecutorService {
  private readonly logger = new Logger(StepExecutorService.name);
  constructor(
    @Inject(ACTION_HANDLERS)
    private readonly handlers: { [key: string]: ActionHandler },
    private readonly dataLayerService: DataLayerService,
    private readonly stepExecutorUtilsService: StepExecutorUtilsService
  ) {}

  async executeStep(
    page: Page,
    step: Step,
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
        this.logger.log('Handle Viewport Successfully');
        break;
      case BrowserAction.NAVIGATE:
        await this.stepExecutorUtilsService.handleNavigate(
          page,
          step,
          state,
          isLastStep,
          application
        );
        this.logger.log('Handle Navigation Successfully');
        break;
      case BrowserAction.WAITFORELEMENT:
        await this.stepExecutorUtilsService.handleWaitForElement(
          page,
          step,
          step.timeout || 10000
        );
        this.logger.log('Handle Wait for element Successfully');
        break;
      case BrowserAction.KEYDOWN:
        this.logger.log(`${step.type} ${step.key}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.keyboard.down(step.key as any);
        break;
      case BrowserAction.KEYUP:
        this.logger.log(`${step.type} ${step.key}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.keyboard.up(step.key as any);
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
          this.logger.warn(`Unknown action type: ${step.type}`);
        }
        break;
    }
  }

  async handleDefaultAction(
    page: Page,
    step: Step,
    projectName: string,
    eventId: string,
    isLastStep: boolean,
    delay: number
  ) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (
      this.handlers[step.type] &&
      typeof this.handlers[step.type].handle === 'function'
    ) {
      const navigationPromise = isLastStep
        ? this.stepExecutorUtilsService.handleNavigationIfNeeded(
            page,
            isLastStep
          )
        : undefined;

      await this.handlers[step.type].handle(
        page,
        projectName,
        eventId,
        step,
        isLastStep
      );
      await navigationPromise;
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        eventId
      );
    } else {
      this.logger.warn(
        `Handler for action type ${step.type} is not properly defined`
      );
    }
  }
}
