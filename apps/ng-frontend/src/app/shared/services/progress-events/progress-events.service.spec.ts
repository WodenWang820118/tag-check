import { TestBed } from '@angular/core/testing';
import { computed, signal, WritableSignal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { TestRunningFacadeService } from '../facade/test-running-facade.service';
import {
  EventCompletedPayload,
  ProgressEventsService,
  ProgressUpdatePayload
} from './progress-events.service';

type Listener = (event: Event) => void;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  closed = false;
  private readonly listeners = new Map<string, Listener[]>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  // The `data` field of an SSE message, as the browser delivers it.
  emit(type: string, data: string): void {
    this.dispatch(type, new MessageEvent(type, { data }));
  }

  dispatch(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  close(): void {
    this.closed = true;
  }
}

describe('ProgressEventsService', () => {
  let isRunningTest: WritableSignal<boolean>;
  let originalEventSource: typeof globalThis.EventSource;

  beforeEach(() => {
    FakeEventSource.instances = [];
    originalEventSource = globalThis.EventSource;
    globalThis.EventSource = FakeEventSource as unknown as typeof EventSource;

    isRunningTest = signal(false);
    TestBed.configureTestingModule({
      providers: [
        ProgressEventsService,
        {
          provide: TestRunningFacadeService,
          useValue: { isRunningTest$: computed(() => isRunningTest()) }
        }
      ]
    });
  });

  afterEach(() => {
    globalThis.EventSource = originalEventSource;
  });

  function startRun(): {
    service: ProgressEventsService;
    stream: FakeEventSource;
  } {
    const service = TestBed.inject(ProgressEventsService);
    isRunningTest.set(true);
    TestBed.tick();
    const stream = FakeEventSource.instances[0];
    if (!stream) {
      throw new Error('no EventSource was opened');
    }
    return { service, stream };
  }

  it('opens one stream to progressEventsUrl only when a run starts', () => {
    TestBed.inject(ProgressEventsService);
    TestBed.tick();
    expect(FakeEventSource.instances).toHaveLength(0);

    const { service, stream } = startRun();
    service.openStream();

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(stream.url).toBe(environment.progressEventsUrl);
  });

  it('emits progressUpdate payloads and skips malformed ones', () => {
    const { service, stream } = startRun();
    const emitted: ProgressUpdatePayload[] = [];
    const sub = service.progressUpdate$.subscribe((v) => emitted.push(v));

    stream.emit('progressUpdate', '{"totalSteps":6,"currentStep":2}');
    stream.emit('progressUpdate', 'not json');
    stream.emit('progressUpdate', '{"totalSteps":"6"}');
    stream.dispatch('progressUpdate', new Event('progressUpdate'));
    sub.unsubscribe();

    expect(emitted).toEqual([{ totalSteps: 6, currentStep: 2 }]);
  });

  it('emits eventCompleted with its message, or empty when unreadable', () => {
    const { service, stream } = startRun();
    const emitted: EventCompletedPayload[] = [];
    const sub = service.eventCompleted$.subscribe((v) => emitted.push(v));

    stream.emit('eventCompleted', '{"message":"add_to_cart"}');
    stream.emit('eventCompleted', 'not json');
    sub.unsubscribe();

    expect(emitted).toEqual([{ message: 'add_to_cart' }, {}]);
  });

  it('closes the stream when the run ends', () => {
    const { stream } = startRun();
    expect(stream.closed).toBe(false);

    isRunningTest.set(false);
    TestBed.tick();

    expect(stream.closed).toBe(true);
  });

  it('closes the stream when the service is destroyed', () => {
    const { service, stream } = startRun();

    service.ngOnDestroy();

    expect(stream.closed).toBe(true);
  });
});
