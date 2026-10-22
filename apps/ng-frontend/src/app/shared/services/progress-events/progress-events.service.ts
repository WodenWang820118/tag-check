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
      const isRunning = this.testRunningFacade.isRunningTest$();
      if (isRunning) {
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

    if (typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource(environment.progressEventsUrl);
    this.eventSource = source;

    source.addEventListener(
      'progressUpdate',
      (event: globalThis.MessageEvent<string>) => {
        try {
          const raw: unknown =
            typeof event.data === 'string'
              ? JSON.parse(event.data)
              : event.data;
          if (
            typeof raw === 'object' &&
            raw !== null &&
            'totalSteps' in raw &&
            'currentStep' in raw
          ) {
            const payload = raw as ProgressUpdatePayload;
            this.progressUpdateSubject.next({
              totalSteps: Number(payload.totalSteps),
              currentStep: Number(payload.currentStep)
            });
          }
        } catch {
          // ignore parse errors
        }
      }
    );

    source.addEventListener(
      'eventCompleted',
      (event: globalThis.MessageEvent<string>) => {
        try {
          const raw: unknown =
            typeof event.data === 'string'
              ? JSON.parse(event.data)
              : event.data;
          if (typeof raw === 'object' && raw !== null) {
            this.eventCompletedSubject.next(raw as EventCompletedPayload);
          } else {
            this.eventCompletedSubject.next({});
          }
        } catch {
          this.eventCompletedSubject.next({});
        }
      }
    );

    source.onerror = () => {
      // EventSource automatically manages retry logic
    };
  }

  closeStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  getEventSource(): EventSource | null {
    return this.eventSource;
  }

  ngOnDestroy(): void {
    this.closeStream();
  }
}
