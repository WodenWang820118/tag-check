import { TestBed } from '@angular/core/testing';
import { computed, signal, WritableSignal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { TestRunningFacadeService } from '../facade/test-running-facade.service';
import {
  ProgressEventsService,
  ProgressUpdatePayload
} from './progress-events.service';

type EventSourceListener = (event: { data: string }) => void;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  closed = false;
  listeners: Record<string, EventSourceListener[]> = {};
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventSourceListener): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  emit(type: string, data: string): void {
    const callbacks = this.listeners[type] ?? [];
    for (const callback of callbacks) {
      callback({ data });
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
    const mockFacade = {
      isRunningTest$: computed(() => isRunningTest())
    };

    TestBed.configureTestingModule({
      providers: [
        ProgressEventsService,
        { provide: TestRunningFacadeService, useValue: mockFacade }
      ]
    });
  });

  afterEach(() => {
    globalThis.EventSource = originalEventSource;
  });

  it('opens EventSource when a run starts and connects to progressEventsUrl', () => {
    const service = TestBed.inject(ProgressEventsService);
    TestBed.tick();
    expect(FakeEventSource.instances).toHaveLength(0);

    isRunningTest.set(true);
    TestBed.tick();

    expect(FakeEventSource.instances).toHaveLength(1);
    const instance = FakeEventSource.instances[0];
    expect(instance?.url).toBe(environment.progressEventsUrl);
    expect(service.getEventSource()).toBe(instance);
  });

  it('parses progressUpdate JSON received from EventSource', () => {
    const service = TestBed.inject(ProgressEventsService);
    isRunningTest.set(true);
    TestBed.tick();

    const instance = FakeEventSource.instances[0];
    const emitted: ProgressUpdatePayload[] = [];
    const sub = service.progressUpdate$.subscribe((val) => emitted.push(val));

    instance?.emit(
      'progressUpdate',
      JSON.stringify({ totalSteps: 6, currentStep: 2 })
    );
    sub.unsubscribe();

    expect(emitted).toEqual([{ totalSteps: 6, currentStep: 2 }]);
  });

  it('closes EventSource when the run ends', () => {
    const service = TestBed.inject(ProgressEventsService);
    isRunningTest.set(true);
    TestBed.tick();

    const instance = FakeEventSource.instances[0];
    expect(instance?.closed).toBe(false);

    isRunningTest.set(false);
    TestBed.tick();

    expect(instance?.closed).toBe(true);
    expect(service.getEventSource()).toBeNull();
  });

  it('closes EventSource when the service is destroyed', () => {
    const service = TestBed.inject(ProgressEventsService);
    isRunningTest.set(true);
    TestBed.tick();

    const instance = FakeEventSource.instances[0];
    expect(instance?.closed).toBe(false);

    service.ngOnDestroy();
    expect(instance?.closed).toBe(true);
    expect(service.getEventSource()).toBeNull();
  });
});
