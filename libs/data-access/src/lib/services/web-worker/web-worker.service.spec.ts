import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebWorkerService } from './web-worker.service';

interface FakeWorker {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((error: unknown) => void) | null;
}

const createdWorkers: FakeWorker[] = [];
const originalWorker = (globalThis as { Worker?: unknown }).Worker;

beforeEach(() => {
  createdWorkers.length = 0;
  (globalThis as unknown as { Worker: unknown }).Worker = function (
    this: FakeWorker
  ) {
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
    this.onmessage = null;
    this.onerror = null;
    createdWorkers.push(this);
  } as unknown as typeof Worker;
});

afterEach(() => {
  if (originalWorker === undefined) {
    delete (globalThis as { Worker?: unknown }).Worker;
  } else {
    (globalThis as unknown as { Worker: unknown }).Worker = originalWorker;
  }
});

describe('WebWorkerService', () => {
  let service: WebWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebWorkerService);
  });

  it('throws when postMessage is called before init', () => {
    expect(() => service.postMessage('cmd', { foo: 'bar' })).toThrowError(
      /Worker not initialized/
    );
  });

  it('init constructs a Worker and routes messages onto the message stream', async () => {
    service.init('script.js');
    expect(createdWorkers).toHaveLength(1);

    const promise = firstValueFrom(service.onMessage());
    createdWorkers[0].onmessage?.({ data: { hello: 'world' } });

    await expect(promise).resolves.toEqual({ hello: 'world' });
  });

  it('postMessage forwards command and payload to the underlying worker', () => {
    service.init('script.js');
    service.postMessage('readXlsx', { fileData: [1, 2, 3] });

    expect(createdWorkers[0].postMessage).toHaveBeenCalledWith({
      cmd: 'readXlsx',
      fileData: [1, 2, 3]
    });
  });

  it('init terminates the previous worker before creating a new one', () => {
    service.init('a.js');
    const first = createdWorkers[0];
    service.init('b.js');

    expect(first.terminate).toHaveBeenCalledOnce();
    expect(createdWorkers).toHaveLength(2);
  });

  it('terminate clears the worker reference and tolerates being called twice', () => {
    service.init('a.js');
    service.terminate();
    expect(createdWorkers[0].terminate).toHaveBeenCalledOnce();
    expect(() => service.terminate()).not.toThrow();
  });

  it('ngOnDestroy terminates the worker and completes the message stream', () => {
    service.init('a.js');
    let completed = false;
    service.onMessage().subscribe({ complete: () => (completed = true) });

    service.ngOnDestroy();

    expect(createdWorkers[0].terminate).toHaveBeenCalledOnce();
    expect(completed).toBe(true);
  });

  it('logs worker errors via console.error', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    service.init('a.js');
    createdWorkers[0].onerror?.(new Error('boom'));
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
