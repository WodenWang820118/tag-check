import { describe, expect, it } from 'vitest';
import { RunQueueService, RunStoppedError } from './run-queue.service';

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('RunQueueService', () => {
  it('starts a run only after the previous one has finished', async () => {
    const queue = new RunQueueService();
    const events: string[] = [];
    const first = deferred();

    const a = queue.run(async () => {
      events.push('a start');
      await first.promise;
      events.push('a end');
      return 'a';
    });
    const b = queue.run(async () => {
      events.push('b start');
      return 'b';
    });
    await tick();

    expect(events).toEqual(['a start']);
    expect(queue.size).toBe(2);

    first.resolve();
    await expect(a).resolves.toBe('a');
    await expect(b).resolves.toBe('b');
    expect(events).toEqual(['a start', 'a end', 'b start']);
    expect(queue.size).toBe(0);
  });

  it('goes on with the next run when one fails or is aborted', async () => {
    const queue = new RunQueueService();
    const first = deferred();

    const a = queue.run(() => first.promise);
    const b = queue.run(async () => 'b');
    first.reject(new Error('Operation aborted'));

    await expect(a).rejects.toThrow('Operation aborted');
    await expect(b).resolves.toBe('b');
  });

  it('stop aborts the running run and drops the queued ones', async () => {
    const queue = new RunQueueService();
    const started: string[] = [];
    let runningSignal: AbortSignal | undefined;

    const a = queue.run(
      (signal) =>
        new Promise<string>((_resolve, reject) => {
          started.push('a');
          runningSignal = signal;
          signal.addEventListener('abort', () =>
            reject(new Error('Operation aborted'))
          );
        })
    );
    const b = queue.run(async () => {
      started.push('b');
      return 'b';
    });
    await tick();

    queue.stop();

    await expect(a).rejects.toThrow('Operation aborted');
    await expect(b).rejects.toBeInstanceOf(RunStoppedError);
    expect(runningSignal?.aborted).toBe(true);
    expect(started).toEqual(['a']);
    expect(queue.size).toBe(0);
  });

  it('runs a run requested after a stop', async () => {
    const queue = new RunQueueService();
    queue.stop();

    await expect(queue.run(async (signal) => signal.aborted)).resolves.toBe(
      false
    );
  });
});
