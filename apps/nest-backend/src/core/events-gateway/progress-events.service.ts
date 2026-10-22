import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface ProgressUpdatePayload {
  totalSteps: number;
  currentStep: number;
}

export interface EventCompletedPayload {
  message: unknown;
}

@Injectable()
export class ProgressEventsService {
  private readonly eventsSubject = new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  sendProgressUpdate(totalSteps: number, currentStep: number): void {
    this.eventsSubject.next({
      type: 'progressUpdate',
      data: { totalSteps, currentStep },
      retry: 1000
    });
  }

  sendEventCompleted(message: unknown): void {
    this.eventsSubject.next({
      type: 'eventCompleted',
      data: { message },
      retry: 1000
    });
  }
}
