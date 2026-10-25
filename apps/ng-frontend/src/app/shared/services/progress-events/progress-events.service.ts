import { effect, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import type {
  BatchRunItemStatus,
  BatchRunStatus,
  BatchUpdatePayload
} from '@utils';
import { environment } from '../../../../environments/environment';
import { TestRunningFacadeService } from '../facade/test-running-facade.service';

export interface ProgressUpdatePayload {
  totalSteps: number;
  currentStep: number;
}

export interface EventCompletedPayload {
  message?: unknown;
}

const BATCH_STATUSES: readonly BatchRunStatus[] = [
  'pending',
  'running',
  'completed',
  'cancelled'
];

const ITEM_STATUSES: readonly BatchRunItemStatus[] = [
  'pending',
  'running',
  'passed',
  'partial',
  'failed',
  'error',
  'cancelled'
];

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

function isBatchUpdateItem(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'eventId' in value &&
    typeof value.eventId === 'string' &&
    'status' in value &&
    ITEM_STATUSES.some((status) => status === value.status) &&
    'message' in value &&
    (value.message === null || typeof value.message === 'string')
  );
}

function isBatchUpdate(value: unknown): value is BatchUpdatePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'batchId' in value &&
    typeof value.batchId === 'number' &&
    'projectSlug' in value &&
    typeof value.projectSlug === 'string' &&
    'status' in value &&
    BATCH_STATUSES.some((status) => status === value.status) &&
    'items' in value &&
    Array.isArray(value.items) &&
    value.items.every(isBatchUpdateItem)
  );
}

/**
 * Receives run progress and batch updates from GET /events. The stream is
 * open only while a test runs or something holds it (the batch run, while
 * the Tests page shows a project), so it does not hold one of the browser's
 * connections to the API otherwise.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressEventsService implements OnDestroy {
  private readonly testRunningFacade = inject(TestRunningFacadeService);

  private readonly progressUpdateSubject = new Subject<ProgressUpdatePayload>();
  private readonly eventCompletedSubject = new Subject<EventCompletedPayload>();
  private readonly batchUpdateSubject = new Subject<BatchUpdatePayload>();
  private readonly holds = signal(0);
  private wasRunningTest = false;

  readonly progressUpdate$: Observable<ProgressUpdatePayload> =
    this.progressUpdateSubject.asObservable();
  readonly eventCompleted$: Observable<EventCompletedPayload> =
    this.eventCompletedSubject.asObservable();
  /** `batchUpdate` events: a batch was created, started, changed or ended. */
  readonly batchUpdate$: Observable<BatchUpdatePayload> =
    this.batchUpdateSubject.asObservable();

  private eventSource: EventSource | null = null;

  constructor() {
    effect(() => {
      const running = this.testRunningFacade.isRunningTest$();
      if (running && !this.wasRunningTest) {
        // A new run has no steps yet. The backend sends eventCompleted,
        // which resets the progress, only after the last step, so a run
        // that failed or was stopped left its steps behind for the next
        // run to show.
        this.progressUpdateSubject.next({ totalSteps: 0, currentStep: 0 });
      }
      this.wasRunningTest = running;
      if (running || this.holds() > 0) {
        this.openStream();
      } else {
        this.closeStream();
      }
    });
  }

  /**
   * Keeps the stream open until the returned function is called, for a
   * listener of events that arrive between runs, such as `batchUpdate`.
   */
  hold(): () => void {
    this.holds.update((count) => count + 1);
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.holds.update((count) => Math.max(0, count - 1));
      }
    };
  }

  openStream(): void {
    if (this.eventSource) {
      return;
    }
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

    source.addEventListener('batchUpdate', (event) => {
      const data = parseData(event);
      if (isBatchUpdate(data)) {
        this.batchUpdateSubject.next(data);
      }
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
