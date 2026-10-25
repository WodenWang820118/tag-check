import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Rejects a run that was stopped while it waited in the queue. It never
 * started, so it opened no browser and saved no result.
 */
export class RunStoppedError extends HttpException {
  constructor() {
    super(
      'The run was stopped before it started',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Runs test inspections one at a time. Each run opens a browser, replays a
 * recording and captures network traffic; running several at once costs CPU
 * and bandwidth and lets their results interfere. A run requested while
 * another is in progress (a second window, or a batch resumed while the
 * previous run is still finishing) starts when the earlier ones have ended,
 * whether they passed, failed or were aborted.
 *
 * Every run gets its own abort signal. `stop` aborts the running run and
 * every queued one, direct and accompanied alike, since they share the
 * queue: a stopped batch does not go on with a run it had already requested.
 */
@Injectable()
export class RunQueueService {
  private tail: Promise<unknown> = Promise.resolve();
  /** One controller per run requested and not yet finished. */
  private readonly runs = new Set<AbortController>();

  /** Runs that have been requested and not yet finished, including the running one. */
  get size(): number {
    return this.runs.size;
  }

  /**
   * Starts `task` once every earlier task has settled, and settles as it
   * does. A task that rejects does not stop the ones queued after it. A task
   * stopped before its turn does not start; its promise rejects with
   * RunStoppedError.
   */
  run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    this.runs.add(controller);
    const result = this.tail
      .then(() => {
        if (controller.signal.aborted) {
          throw new RunStoppedError();
        }
        return task(controller.signal);
      })
      .finally(() => {
        this.runs.delete(controller);
      });
    this.tail = result.catch(() => undefined);
    return result;
  }

  /**
   * Aborts the running run and drops every queued one. Runs requested after
   * this call queue as usual.
   */
  stop(): void {
    for (const controller of this.runs) {
      controller.abort();
    }
  }
}
