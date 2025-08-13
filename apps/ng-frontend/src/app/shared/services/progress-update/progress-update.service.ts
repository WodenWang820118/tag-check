import { computed, effect, Injectable, signal } from '@angular/core';
import { WebSocketService } from '../web-socket/web-socket.service';

@Injectable({
  providedIn: 'root'
})
export class ProgressUpdateService {
  private readonly _currentStep = signal<number>(0);
  private readonly _totalSteps = signal<number>(0);
  currentStep$ = computed(() => this._currentStep());
  totalSteps$ = computed(() => this._totalSteps());

  constructor(private readonly webSocketService: WebSocketService) {
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

          if (data.currentStep === data.totalSteps) {
            console.log('All steps completed');
            // Reset the progress state
            this.setCurrentStep(0);
            this.setTotalSteps(0);
          }
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
}
