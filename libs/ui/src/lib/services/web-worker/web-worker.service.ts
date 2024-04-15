import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebWorkerService {
  private worker: Worker | undefined;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // the error occurs and cannot be resolved when initialing tests with import.meta.url
      this.worker = new Worker(new URL('../../app.worker.ts', import.meta.url));
      // this.worker = new Worker(new URL('../../app.worker.ts'));

      this.worker.onmessage = ({ data }) => {
        this.subject.next(data);
      };
    } else {
      console.warn('Web Workers are not supported in this environment.');
    }
  }

  private subject = new Subject<any>();

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
