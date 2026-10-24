import { Inject, Injectable, Logger } from '@nestjs/common';
import { KeyInput, Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { ACTION_HANDLERS, ActionHandler } from '../handlers/utils';
import {
  StepExecutorUtilsService,
  StepReplayState
} from './step-executor-utils.service';
import { EventInspectionPresetDto } from '../../../../shared/dto/event-inspection-preset.dto';
import { Step } from '@utils';
import { BrowserAction } from '../action-utils';

/** One recorded step and the replay it belongs to. */
export interface StepExecution {
  page: Page;
  step: Step;
  projectSlug: string;
  eventId: string;
  /** Shared by every step of one replay. */
  state: StepReplayState;
  /** The last step waits for the navigation it may start. */
  isLastStep: boolean;
  application: EventInspectionPresetDto['application'];
  /** The recording's last click, which may be kept from navigating away. */
  isLastClick?: boolean;
}

/**
 * Replays one Chrome Recorder step. Viewport, navigation, waits and keys are
 * handled here; clicks, changes and hovers go to their ACTION_HANDLERS
 * entry. A step that fails throws, which ends the replay.
 */
@Injectable()
export class StepExecutorService {
  private readonly logger = new Logger(StepExecutorService.name);
  constructor(
    @Inject(ACTION_HANDLERS)
    private readonly handlers: { [key: string]: ActionHandler },
    private readonly dataLayerService: DataLayerService,
    private readonly stepExecutorUtilsService: StepExecutorUtilsService
  ) {}

  async executeStep({
    page,
    step,
    projectSlug,
    eventId,
    state,
    isLastStep,
    application,
    isLastClick = false
  }: StepExecution) {
    // 3 to 5 s: the pause before a click, change or hover, and the
    // navigation wait after a key-up.
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
        await page.keyboard.down(step.key as KeyInput);
        break;
      case BrowserAction.KEYUP:
        this.logger.log(`${step.type} ${step.key}`);
        await page.keyboard.up(step.key as KeyInput);
        await this.stepExecutorUtilsService.handleKeyboardAction(
          page,
          projectSlug,
          eventId,
          isLastStep,
          randomDelay
        );
        break;
      default:
        await this.handleDefaultAction(
          page,
          step,
          projectSlug,
          eventId,
          isLastStep,
          randomDelay,
          isLastClick
        );
        break;
    }
  }

  /**
   * Waits `delay`, then runs the step's handler and snapshots the dataLayer.
   * A step type without a handler is logged and skipped.
   */
  async handleDefaultAction(
    page: Page,
    step: Step,
    projectName: string,
    eventId: string,
    isLastStep: boolean,
    delay: number,
    isLastClick = false
  ) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (
      this.handlers[step.type] &&
      typeof this.handlers[step.type].handle === 'function'
    ) {
      // Started before the action: a navigation the action triggers can
      // finish before a wait registered afterwards would see it.
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
        isLastClick
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
