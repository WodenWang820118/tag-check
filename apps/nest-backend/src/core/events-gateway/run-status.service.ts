import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  BatchFinishedPayload,
  RunOutcomeStatus,
  RunStatusMessage,
  RunStatusPayload,
  RunStatusTest
} from '@utils';
import { ProgressEventsService } from './progress-events.service';
import {
  formatStatusLine,
  STATUS_LINE_WRITER,
  statusLineWriterFromEnv,
  type StatusLineWriter
} from './status-line';

/**
 * Keeps the status of the run in progress (one at a time: runs share one
 * queue) and publishes every change and every finished run or batch:
 *
 * - as server-sent events on GET /events: `runStatus`, `runFinished`,
 *   `batchFinished`, and `progressUpdate` per replay step;
 * - as `TAGCHECK_STATUS` lines on stdout when the backend runs as the
 *   desktop sidecar, which the desktop app shows in its tray and
 *   notifications.
 *
 * Fed by the run tracker (start and end of every run), ActionService (each
 * replay step) and the batch queue (batch end).
 */
@Injectable()
export class RunStatusService {
  private status: RunStatusPayload = { state: 'idle' };
  private readonly writeLine: StatusLineWriter | null;

  constructor(
    private readonly progressEvents: ProgressEventsService,
    @Optional()
    @Inject(STATUS_LINE_WRITER)
    writeLine?: StatusLineWriter | null
  ) {
    this.writeLine =
      writeLine === undefined
        ? statusLineWriterFromEnv(process.env, process.stdout)
        : writeLine;
  }

  /** The current status. */
  get current(): RunStatusPayload {
    return this.status;
  }

  /** A run of `test` has begun; its replay has no step yet. */
  start(test: RunStatusTest): void {
    this.setStatus({ state: 'starting', ...test });
  }

  /**
   * The replay of `eventId` is about to run step `currentStep` (1-based) of
   * `totalSteps`. Sends `progressUpdate` in every case, and moves the status
   * to `running` when `eventId` is the run in progress.
   */
  step(eventId: string, totalSteps: number, currentStep: number): void {
    const test = this.activeTest(eventId);
    this.progressEvents.sendProgressUpdate(totalSteps, currentStep, {
      eventId,
      eventName: test?.eventName
    });
    if (test) {
      this.setStatus({ state: 'running', ...test, currentStep, totalSteps });
    }
  }

  /**
   * The run in progress ended: sends `runFinished` and moves the status to
   * `idle`. Does nothing when no run is in progress.
   */
  finish(status: RunOutcomeStatus, message: string | null = null): void {
    const test = this.activeTest();
    if (!test) {
      return;
    }
    this.publish({ type: 'runFinished', data: { ...test, status, message } });
    this.setStatus({ state: 'idle' });
  }

  /** A batch ended: sends `batchFinished`. */
  finishBatch(payload: BatchFinishedPayload): void {
    this.publish({ type: 'batchFinished', data: payload });
  }

  /** The test of the run in progress, if it is `eventId` (when given). */
  private activeTest(eventId?: string): RunStatusTest | undefined {
    if (this.status.state === 'idle') {
      return undefined;
    }
    if (eventId !== undefined && this.status.eventId !== eventId) {
      return undefined;
    }
    const { projectSlug, eventName, testName, batch } = this.status;
    const test: RunStatusTest = {
      projectSlug,
      eventId: this.status.eventId,
      eventName,
      testName
    };
    if (batch) test.batch = batch;
    return test;
  }

  private setStatus(status: RunStatusPayload): void {
    this.status = status;
    this.publish({ type: 'runStatus', data: status });
  }

  private publish(message: RunStatusMessage): void {
    switch (message.type) {
      case 'runStatus':
        this.progressEvents.sendRunStatus(message.data);
        break;
      case 'runFinished':
        this.progressEvents.sendRunFinished(message.data);
        break;
      case 'batchFinished':
        this.progressEvents.sendBatchFinished(message.data);
        break;
    }
    this.writeLine?.(formatStatusLine(message));
  }
}
