import { effect, inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TestRunningFacadeService } from '../facade/test-running-facade.service';

export interface ProgressUpdatePayload {
  totalSteps: number;
  currentStep: number;
}

export interface EventCompletedPayload {
  message?: unknown;
}

/** Parses an SSE `data` field; returns undefined when it is not JSON. */
function parseData(event: Event): unknown {
  if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
    return undefined;
  }
  try {
    return JSON.parse(event.data);
  } catch {
    return undefined;
  }
}

function isProgressUpdate(value: unknown): value is ProgressUpdatePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'totalSteps' in value &&
    'currentStep' in value &&
    typeof value.totalSteps === 'number' &&
    typeof value.currentStep === 'number'
  );
}

/**
 * Receives run progress from GET /events. The stream is open only while a
 * test runs, so it does not hold one of the browser's connections to the API
 * between runs.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressEventsService implements OnDestroy {
  private readonly testRunningFacade = inject(TestRunningFacadeService);

  private readonly progressUpdateSubject = new Subject<ProgressUpdatePayload>();
  private readonly eventCompletedSubject = new Subject<EventCompletedPayload>();

  readonly progressUpdate$: Observable<ProgressUpdatePayload> =
    this.progressUpdateSubject.asObservable();
  readonly eventCompleted$: Observable<EventCompletedPayload> =
    this.eventCompletedSubject.asObservable();

  private eventSource: EventSource | null = null;

  constructor() {
    effect(() => {
      if (this.testRunningFacade.isRunningTest$()) {
        this.openStream();
      } else {
        this.closeStream();
      }
    });
  }

  openStream(): void {
    if (this.eventSource) {
      return;
    }
    // A new run has no steps yet. The backend sends eventCompleted, which
    // resets the progress, only after the last step, so a run that failed
    // or was stopped left its steps behind for the next run to show.
    this.progressUpdateSubject.next({ totalSteps: 0, currentStep: 0 });
    const source = new EventSource(environment.progressEventsUrl);
    this.eventSource = source;

    source.addEventListener('progressUpdate', (event) => {
      const data = parseData(event);
      if (isProgressUpdate(data)) {
        this.progressUpdateSubject.next({
          totalSteps: data.totalSteps,
          currentStep: data.currentStep
        });
      }
    });

    source.addEventListener('eventCompleted', (event) => {
      const data = parseData(event);
      this.eventCompletedSubject.next(
        typeof data === 'object' && data !== null && 'message' in data
          ? { message: data.message }
          : {}
      );
    });
  }

  closeStream(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  ngOnDestroy(): void {
    this.closeStream();
  }
}
