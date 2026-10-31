import { Injectable, Logger } from '@nestjs/common';
import {
  getCheckStatus,
  type RunOutcomeStatus,
  type RunStatusBatch,
  type RunStatusTest,
  type SelectorTrialRequest
} from '@utils';
import { RunStatusService } from '../../core/events-gateway/run-status.service';
import { RunTimelineService } from '../../core/events-gateway/run-timeline.service';
import { RunStepFallbackService } from '../../core/events-gateway/run-step-fallback.service';
import { RunStepOverrideService } from '../../core/events-gateway/run-step-override.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { toClientErrorMessage } from '../../shared/client-error-message';
import type { SingleEventInspectionResult } from './event-inspection-pipeline.service';

/** The run a caller asks to track: a test, and its batch when it has one. */
export interface TrackedRun {
  projectSlug: string;
  eventId: string;
  batch?: RunStatusBatch;
  /** Selectors one step tries instead of its own: a trial run. */
  stepOverride?: SelectorTrialRequest;
}

/**
 * The status of a run whose pipeline resolved: its two checks, as they are
 * saved and as getCheckStatus reads them. The pipeline resolves with no data
 * when the run failed and was saved as failed.
 */
export function toRunOutcome(
  result: SingleEventInspectionResult
): Exclude<RunOutcomeStatus, 'error' | 'cancelled'> {
  const first = result?.[0];
  if (!first) {
    return 'failed';
  }
  return getCheckStatus(
    first.dataLayerResult.passed,
    first.requestCheckResult?.passed,
    first.requestCheckResult !== null
  );
}

/**
 * Reports the start and end of every run to RunStatusService, and keeps the
 * run's step timeline (RunTimelineService), the fallback selectors it used
 * (RunStepFallbackService) and its step override (RunStepOverrideService)
 * open while it runs. Both run paths, direct
 * (SingleEventInspectionService) and accompanied (GtmOperatorService),
 * wrap their queued task in `track`.
 */
@Injectable()
export class RunTrackerService {
  private readonly logger = new Logger(RunTrackerService.name);

  constructor(
    private readonly runStatus: RunStatusService,
    private readonly testEvents: TestEventRepositoryService,
    private readonly runTimeline: RunTimelineService,
    private readonly runStepFallback: RunStepFallbackService,
    private readonly runStepOverride: RunStepOverrideService
  ) {}

  /**
   * Runs `task`, reporting it as started before and finished after: with
   * its checks' status when it resolves, `cancelled` when `signal` was
   * aborted, `error` when it rejects. Settles as `task` does.
   */
  async track(
    run: TrackedRun,
    signal: AbortSignal,
    task: () => Promise<SingleEventInspectionResult>
  ): Promise<SingleEventInspectionResult> {
    this.runStatus.start(await this.describe(run));
    this.runTimeline.begin(run.eventId);
    this.runStepFallback.begin(run.eventId);
    this.runStepOverride.begin(run.eventId, run.stepOverride ?? null);
    try {
      const result = await task();
      this.runStatus.finish(
        signal.aborted ? 'cancelled' : toRunOutcome(result)
      );
      return result;
    } catch (error) {
      if (signal.aborted) {
        this.runStatus.finish('cancelled');
      } else {
        this.runStatus.finish(
          'error',
          toClientErrorMessage(error) || 'The run failed'
        );
      }
      throw error;
    } finally {
      this.runTimeline.end(run.eventId);
      this.runStepFallback.end(run.eventId);
      this.runStepOverride.end(run.eventId);
    }
  }

  /** The test's names; its eventId stands in when it cannot be read. */
  private async describe(run: TrackedRun): Promise<RunStatusTest> {
    let names = { eventName: run.eventId, testName: run.eventId };
    try {
      const test = await this.testEvents.getEntityBySlugAndEventId(
        run.projectSlug,
        run.eventId
      );
      names = {
        eventName: test.eventName || run.eventId,
        testName: test.testName || run.eventId
      };
    } catch (error) {
      // The run itself reports a missing test.
      this.logger.warn(
        `Could not read ${run.projectSlug}/${run.eventId}: ${error}`
      );
    }
    const test: RunStatusTest = {
      projectSlug: run.projectSlug,
      eventId: run.eventId,
      ...names
    };
    if (run.batch) test.batch = run.batch;
    return test;
  }
}
