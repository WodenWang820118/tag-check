import { Injectable, effect, inject, signal } from '@angular/core';
import { WebSocketService } from '../web-socket/web-socket.service';

@Injectable({
  providedIn: 'root'
})
export class ProgressUpdateService {
  private readonly webSocketService = inject(WebSocketService);

  private readonly _currentStep = signal<number>(0);
  private readonly _totalSteps = signal<number>(0);
  private readonly _eventCompleted = signal<boolean>(false);

  readonly currentStep$ = this._currentStep.asReadonly();
  readonly totalSteps$ = this._totalSteps.asReadonly();
  readonly eventCompleted$ = this._eventCompleted.asReadonly();

  constructor() {
    this.initializeSocketListeners();
  }

  private initializeSocketListeners() {
    effect(() => {
      if (this.webSocketService.connectionStatus$()) {
        console.log(
          'Connected to server; Starting to listen for progress updates'
        );
        this.webSocketService.getSocket().on('progressUpdate', (data) => {
          console.warn('Received progress update', data);
          this.setCurrentStep(data.currentStep);
          this.setTotalSteps(data.totalSteps);
        });

        this.webSocketService.getSocket().on('eventCompleted', (data) => {
          console.warn('Received event completed', data);
          this.setEventCompleted(true);
          console.log(
            'All steps completed via event; resetting progress state'
          );
          // Reset the progress state after completion event
          this.setCurrentStep(0);
          this.setTotalSteps(0);
        });
      }
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
