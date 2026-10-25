import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type {
  BatchFinishedPayload,
  BatchUpdatePayload,
  RunFinishedPayload,
  RunStatusPayload
} from '@utils';

/** The data of a `progressUpdate` event: the step a replay has reached. */
export interface ProgressUpdatePayload {
  totalSteps: number;
  currentStep: number;
  /** The test being replayed; absent when the caller did not say. */
  eventId?: string;
  /** Its GA4 event name; absent when the test is unknown. */
  eventName?: string;
}

/** The data of an `eventCompleted` event. */
export interface EventCompletedPayload {
  message: unknown;
}

/**
 * Broadcasts run progress to the frontend over SSE (`GET /events`).
 *
 * The stream is hot: a client receives only the events sent while it is
 * subscribed, so the frontend opens it before it starts a run.
 */
@Injectable()
export class ProgressEventsService {
  private readonly eventsSubject = new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  /**
   * Reports that the replay is about to run step `currentStep` (1-based),
   * with the test it replays when known.
   */
  sendProgressUpdate(
    totalSteps: number,
    currentStep: number,
    test: { eventId?: string; eventName?: string } = {}
  ): void {
    const data: ProgressUpdatePayload = { totalSteps, currentStep };
    if (test.eventId !== undefined) data.eventId = test.eventId;
    if (test.eventName !== undefined) data.eventName = test.eventName;
    this.eventsSubject.next({
      type: 'progressUpdate',
      data,
      // Asks the browser to reconnect after 1 s if the stream drops.
      retry: 1000
    });
  }

  /** Reports that every step of a replay ran; `message` is the test's eventId. */
  sendEventCompleted(message: unknown): void {
    this.eventsSubject.next({
      type: 'eventCompleted',
      data: { message },
      retry: 1000
    });
  }

  /**
   * Reports a batch's state after it changed: created, started, an item
   * started or ended, cancelled or ended.
   */
  sendBatchUpdate(payload: BatchUpdatePayload): void {
    this.eventsSubject.next({
      type: 'batchUpdate',
      data: payload,
      retry: 1000
    });
  }

  /** Reports the run status after it changed (see RunStatusService). */
  sendRunStatus(payload: RunStatusPayload): void {
    this.eventsSubject.next({ type: 'runStatus', data: payload, retry: 1000 });
  }

  /** Reports that a run ended, a batch's runs included. */
  sendRunFinished(payload: RunFinishedPayload): void {
    this.eventsSubject.next({
      type: 'runFinished',
      data: payload,
      retry: 1000
    });
  }

  /** Reports that a batch ended, completed or cancelled. */
  sendBatchFinished(payload: BatchFinishedPayload): void {
    this.eventsSubject.next({
      type: 'batchFinished',
      data: payload,
      retry: 1000
    });
  }
}
