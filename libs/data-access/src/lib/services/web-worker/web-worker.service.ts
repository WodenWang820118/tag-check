/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebWorkerService {
  private readonly worker: Worker | undefined;
  private readonly subject = new Subject<any>();

  // To send data to worker
  postMessage(command: string, data: any): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    this.worker.postMessage({ cmd: command, ...data });
  }

  // To receive messages from worker
  onMessage(): Observable<any> {
    return this.subject.asObservable();
  }

  // To terminate the worker if needed
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
