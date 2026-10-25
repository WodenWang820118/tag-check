import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

/** The data of a `progressUpdate` event: the step a replay has reached. */
export interface ProgressUpdatePayload {
  totalSteps: number;
  currentStep: number;
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

  /** Reports that the replay is about to run step `currentStep` (1-based). */
  sendProgressUpdate(totalSteps: number, currentStep: number): void {
    this.eventsSubject.next({
      type: 'progressUpdate',
      data: { totalSteps, currentStep },
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
}
