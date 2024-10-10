import { BehaviorSubject, filter, Observable, take, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { WebSocketService } from '../web-socket/web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class ProgressUpdateService {
  private _currentStep = new BehaviorSubject<number>(0);
  private _totalSteps = new BehaviorSubject<number>(0);

  constructor(private webSocketService: WebSocketService) {
    this.initializeSocketListeners();
  }

  private initializeSocketListeners() {
    this.webSocketService
      .getConnectionStatus()
      .pipe(
        filter((isConnected) => isConnected),
        take(1),
        tap(() => {
          console.log(
            'Connected to server; Starting to listen for progress updates'
          );
          this.webSocketService.getSocket().on('progressUpdate', (data) => {
            this.setCurrentStep(data.currentStep);
            this.setTotalSteps(data.totalSteps);

            if (data.currentStep === data.totalSteps) {
              console.log('All steps completed');
              // Reset the progress state
              this.setCurrentStep(0);
              this.setTotalSteps(0);
            }
          });
        })
      )
      .subscribe();
  }

  getCurrentStep(): Observable<number> {
    return this._currentStep;
  }

  getTotalSteps(): Observable<number> {
    return this._totalSteps;
  }

  setCurrentStep(step: number) {
    this._currentStep.next(step);
  }

  setTotalSteps(steps: number) {
    this._totalSteps.next(steps);
  }
}
