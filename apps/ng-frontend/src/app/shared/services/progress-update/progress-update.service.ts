import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProgressEventsService } from '../progress-events/progress-events.service';

/** The running test's steps as signals, fed by ProgressEventsService. */
@Injectable({
  providedIn: 'root'
})
export class ProgressUpdateService {
  private readonly progressEventsService = inject(ProgressEventsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _currentStep = signal<number>(0);
  private readonly _totalSteps = signal<number>(0);
  private readonly _eventCompleted = signal<boolean>(false);

  readonly currentStep$ = this._currentStep.asReadonly();
  readonly totalSteps$ = this._totalSteps.asReadonly();
  readonly eventCompleted$ = this._eventCompleted.asReadonly();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners() {
    this.progressEventsService.progressUpdate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.setCurrentStep(data.currentStep);
        this.setTotalSteps(data.totalSteps);
      });

    this.progressEventsService.eventCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.setEventCompleted(true);
        this.setCurrentStep(0);
        this.setTotalSteps(0);
      });
  }

  setCurrentStep(step: number) {
    this._currentStep.set(step);
  }

  setTotalSteps(steps: number) {
    this._totalSteps.set(steps);
  }

  setEventCompleted(completed: boolean) {
    this._eventCompleted.set(completed);
  }
}
