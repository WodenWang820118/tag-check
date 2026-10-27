import { Inject, Injectable, Logger } from '@nestjs/common';
import { KeyInput, Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { ACTION_HANDLERS, ActionHandler } from '../handlers/utils';
import { TestEventRepositoryService } from '../../../../core/repository/test-event/test-event-repository.service';
import {
  assertsNavigation,
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
  /**
   * Called when the step acts: for a click, change or hover after the wait
   * it starts with, right before the action; at once for other steps.
   */
  onAction?: () => void;
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
    private readonly stepExecutorUtilsService: StepExecutorUtilsService,
    private readonly testEventRepositoryService: TestEventRepositoryService
  ) {}

  async executeStep({
    page,
    step,
    projectSlug,
    eventId,
    state,
    isLastStep,
    application,
    isLastClick = false,
    onAction
  }: StepExecution) {
    // 3 to 5 s: the pause before a click, change or hover, and the
    // navigation wait after a key-up.
    const randomDelay = 3000 + Math.floor(Math.random() * 2000);

    if (!this.waitsBeforeAction(step)) {
      onAction?.();
    }
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
      case BrowserAction.KEYUP: {
        this.logger.log(`${step.type} ${step.key}`);
        // Started before the key is released: the navigation it triggers can
        // finish before a wait registered afterwards would see it. The last
        // step already waits inside handleKeyboardAction.
        const assertedNavigation =
          !isLastStep && assertsNavigation(step)
            ? this.stepExecutorUtilsService.waitForAssertedNavigation(page)
            : undefined;
        await page.keyboard.up(step.key as KeyInput);
        await assertedNavigation;
        await this.stepExecutorUtilsService.handleKeyboardAction(
          page,
          projectSlug,
          eventId,
          isLastStep,
          randomDelay
        );
        break;
      }
      default:
        await this.handleDefaultAction(
          page,
          step,
          projectSlug,
          eventId,
          isLastStep,
          randomDelay,
          isLastClick,
          onAction
        );
        break;
    }
  }

  /** Steps handleDefaultAction runs, which wait before they act. */
  private waitsBeforeAction(step: Step): boolean {
    return !(
      [
        BrowserAction.SETVIEWPORT,
        BrowserAction.NAVIGATE,
        BrowserAction.WAITFORELEMENT,
        BrowserAction.KEYDOWN,
        BrowserAction.KEYUP
      ] as string[]
    ).includes(step.type);
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
    isLastClick = false,
    onAction?: () => void
  ) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    onAction?.();
    const handler = this.handlers[step.type];
    if (!handler || typeof handler.handle !== 'function') {
      this.logger.warn(
        `Handler for action type ${step.type} is not properly defined`
      );
      return;
    }
    // Started before the action: a navigation the action triggers can
    // finish before a wait registered afterwards would see it. The wait
    // sits in an object because an async function would otherwise adopt
    // the promise and not act until the navigation had already finished.
    const navigation = await this.beginNavigationWait(
      page,
      step,
      projectName,
      eventId,
      isLastStep,
      isLastClick
    );

    await handler.handle(page, projectName, eventId, step, isLastClick);
    await navigation?.finished;
    await this.dataLayerService.updateSelfDataLayer(page, projectName, eventId);
  }

  /**
   * The navigation wait for this step, already started, or undefined when
   * the step should not wait. The last step keeps its existing wait, which
   * also gives the event's tags time to fire. A click or change that is not
   * the last step waits only when the recorder asserted a navigation, and
   * not for the last click when the test's stopNavigation cancels it.
   */
  private async beginNavigationWait(
    page: Page,
    step: Step,
    projectName: string,
    eventId: string,
    isLastStep: boolean,
    isLastClick: boolean
  ): Promise<{ finished: Promise<void> } | undefined> {
    if (isLastStep) {
      return {
        finished: this.stepExecutorUtilsService.handleNavigationIfNeeded(
          page,
          true
        )
      };
    }
    if (
      (step.type === BrowserAction.CLICK ||
        step.type === BrowserAction.CHANGE) &&
      assertsNavigation(step) &&
      !(isLastClick && (await this.navigationPrevented(projectName, eventId)))
    ) {
      return {
        finished: this.stepExecutorUtilsService.waitForAssertedNavigation(page)
      };
    }
    return undefined;
  }

  private async navigationPrevented(
    projectName: string,
    eventId: string
  ): Promise<boolean> {
    const test =
      await this.testEventRepositoryService.getEntityBySlugAndEventId(
        projectName,
        eventId
      );
    return test.stopNavigation === true;
  }
}
