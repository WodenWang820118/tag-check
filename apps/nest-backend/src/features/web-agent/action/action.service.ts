import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { chooseFallbackCandidate, type Step } from '@utils';
import { StepExecutorService } from './step-executor/step-executor.service';
import { BrowserAction } from './action-utils';
import { EventInspectionPresetDto } from '../../../shared/dto/event-inspection-preset.dto';
import { ProgressEventsService } from '../../../core/events-gateway/progress-events.service';
import { RunStatusService } from '../../../core/events-gateway/run-status.service';
import { RunTimelineService } from '../../../core/events-gateway/run-timeline.service';
import { RunStepOverrideService } from '../../../core/events-gateway/run-step-override.service';
import { RunStepFallbackService } from '../../../core/events-gateway/run-step-fallback.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
import { StepElementNotFoundError } from './step-failure/step-element-not-found.error';
import { StepFailureCollectorService } from './step-failure/step-failure-collector.service';

/**
 * How long a fallback retry waits for its element. The element was just
 * seen while the failure was recorded, so it should be there at once.
 */
export const FALLBACK_STEP_TIMEOUT_MS = 5_000;

/** Steps that look for an element and can be retried with one selector. */
const FALLBACK_STEP_TYPES: ReadonlySet<string> = new Set([
  BrowserAction.CLICK,
  BrowserAction.CHANGE,
  BrowserAction.HOVER,
  BrowserAction.WAITFORELEMENT
]);

/**
 * Replays a test's Chrome Recorder recording on a page, step by step, and
 * reports each step to RunStatusService, which sends it over SSE and to the
 * desktop tray, and the moment each step acts to RunTimelineService. A test
 * without a recording replays nothing.
 * Rejects with the error of the first step that fails. When a step could not
 * find its element, that error carries the step's index and what the page
 * showed then. A click, change, hover or waitForElement is retried once
 * first, when one candidate clearly is the recorded element.
 */
@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);
  constructor(
    private readonly progressEventsService: ProgressEventsService,
    private readonly stepExecutorService: StepExecutorService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly runStatusService: RunStatusService,
    private readonly runTimelineService: RunTimelineService,
    private readonly stepFailureCollector: StepFailureCollectorService,
    private readonly runStepOverride: RunStepOverrideService,
    private readonly runStepFallback: RunStepFallbackService
  ) {}

  async performOperation(
    page: Page,
    projectSlug: string,
    eventId: string,
    application: EventInspectionPresetDto['application']
  ) {
    const operation = await this.recordingRepositoryService.getRecordingDetails(
      projectSlug,
      eventId
    );
    const steps = operation?.steps;

    if (!operation || !steps) return;

    const totalSteps = steps.length;
    const state = {
      isFirstNavigation: true
    };
    const lastClickIndex = steps.map((step) => step.type).lastIndexOf('click');

    for (const [i, recorded] of steps.entries()) {
      // A trial run tries other selectors for one step.
      const override = this.runStepOverride.selectorsFor(eventId, i);
      const step = override
        ? { ...recorded, selectors: override.map((selector) => [selector]) }
        : recorded;
      this.logger.log(`Performing step ${i + 1} of ${totalSteps}`);
      this.runStatusService.step(eventId, totalSteps, i + 1);

      try {
        // Sequential on purpose: each step acts on the page the previous
        // steps left behind.
        await this.stepExecutorService.executeStep({
          page,
          step,
          projectSlug,
          eventId,
          state,
          isLastStep: i === totalSteps - 1,
          application,
          isLastClick: i === lastClickIndex,
          onAction: () => this.runTimelineService.markStep(eventId, i)
        });
      } catch (error) {
        if (error instanceof StepElementNotFoundError) {
          error.stepIndex = i;
          error.context = await this.stepFailureCollector.collect(
            page,
            step,
            i,
            error.timeoutMs
          );
          const recovered = await this.retryWithFallback({
            page,
            projectSlug,
            eventId,
            index: i,
            step,
            usingOverride: override !== null,
            error,
            state,
            isLastStep: i === totalSteps - 1,
            isLastClick: i === lastClickIndex,
            application
          });
          if (recovered) continue;
        }
        throw error;
      }
    }
    this.logger.log('Operation performed successfully');
    this.progressEventsService.sendEventCompleted(eventId);
  }

  /**
   * Runs the step once more with the one candidate that clearly is the
   * recorded element. True when that retry succeeded. A trial keeps the
   * selectors it was given. Any failure of the retry is dropped: the run
   * reports the original error, whose selectors are the recorded ones.
   */
  private async retryWithFallback(attempt: {
    page: Page;
    projectSlug: string;
    eventId: string;
    index: number;
    step: Step;
    usingOverride: boolean;
    error: StepElementNotFoundError;
    state: { isFirstNavigation: boolean };
    isLastStep: boolean;
    isLastClick: boolean;
    application: EventInspectionPresetDto['application'];
  }): Promise<boolean> {
    const {
      page,
      projectSlug,
      eventId,
      index,
      step,
      usingOverride,
      error,
      state,
      isLastStep,
      isLastClick,
      application
    } = attempt;
    if (
      usingOverride ||
      !FALLBACK_STEP_TYPES.has(step.type) ||
      !error.context
    ) {
      return false;
    }
    const choice = chooseFallbackCandidate(error.context);
    const selector = choice?.candidate.selectors[0];
    if (!choice || !selector) return false;

    try {
      await this.stepExecutorService.executeStep({
        page,
        step: {
          ...step,
          selectors: choice.candidate.selectors.map((part) => [part]),
          timeout: FALLBACK_STEP_TIMEOUT_MS
        },
        projectSlug,
        eventId,
        state,
        isLastStep,
        application,
        isLastClick,
        onAction: () => this.runTimelineService.markStep(eventId, index)
      });
    } catch (retryError) {
      this.logger.warn(
        `Step ${index + 1} fallback failed, so the run keeps the recorded selectors: ${String(retryError)}`
      );
      return false;
    }

    this.logger.log(
      `Step ${index + 1} (${step.type}) used a fallback selector ${selector}`
    );
    this.runStepFallback.record(eventId, {
      stepIndex: index,
      stepType: step.type,
      selector,
      matchedBy: choice.matchedBy,
      value: choice.value
    });
    return true;
  }
}
