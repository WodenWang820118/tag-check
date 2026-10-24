import { Injectable } from '@nestjs/common';

/**
 * Runs test inspections one at a time. Each run opens a browser, replays a
 * recording and captures network traffic; running several at once costs CPU
 * and bandwidth and lets their results interfere. A run requested while
 * another is in progress (a second window, or a batch resumed while the
 * previous run is still finishing) starts when the earlier ones have ended,
 * whether they passed, failed or were aborted.
 */
@Injectable()
export class RunQueueService {
  private tail: Promise<unknown> = Promise.resolve();
  private pending = 0;

  /** Runs that have been requested and not yet finished, including the running one. */
  get size(): number {
    return this.pending;
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    this.pending++;
    const result = this.tail.then(task).finally(() => {
      this.pending--;
    });
    this.tail = result.catch(() => undefined);
    return result;
  }
}
