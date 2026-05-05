/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebWorkerService implements OnDestroy {
  private worker: Worker | null = null;
  private readonly subject = new Subject<any>();

  /**
   * Initialize the worker with a given script URL.
   * Must be called before postMessage().
   */
  init(workerScript: string | URL): void {
    if (this.worker) {
      this.terminate();
    }
    this.worker = new Worker(workerScript);
    this.worker.onmessage = ({ data }) => this.subject.next(data);
    this.worker.onerror = (err) => {
      console.error('[WebWorkerService] Worker error:', err);
    };
  }

  // To send data to worker
  postMessage(command: string, data: any): void {
    if (!this.worker) {
      throw new Error('Worker not initialized. Call init(workerScript) first.');
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
      this.worker = null;
    }
  }

  ngOnDestroy(): void {
    this.terminate();
    this.subject.complete();
  }
}
