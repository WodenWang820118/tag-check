import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EventCompletedPayload,
  ProgressEventsService,
  ProgressUpdatePayload
} from '../progress-events/progress-events.service';
import { ProgressUpdateService } from './progress-update.service';

describe('ProgressUpdateService', () => {
  let progressUpdateSubject: Subject<ProgressUpdatePayload>;
  let eventCompletedSubject: Subject<EventCompletedPayload>;
  let mockProgressEventsService: {
    progressUpdate$: Subject<ProgressUpdatePayload>;
    eventCompleted$: Subject<EventCompletedPayload>;
  };

  beforeEach(() => {
    progressUpdateSubject = new Subject<ProgressUpdatePayload>();
    eventCompletedSubject = new Subject<EventCompletedPayload>();
    mockProgressEventsService = {
      progressUpdate$: progressUpdateSubject,
      eventCompleted$: eventCompletedSubject
    };

    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        ProgressUpdateService,
        {
          provide: ProgressEventsService,
          useValue: mockProgressEventsService
        }
      ]
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('exposes signal-backed defaults of 0/0/false', () => {
    const service = TestBed.inject(ProgressUpdateService);
    expect(service.currentStep$()).toBe(0);
    expect(service.totalSteps$()).toBe(0);
    expect(service.eventCompleted$()).toBe(false);
  });

  it('round-trips current/total/eventCompleted setters', () => {
    const service = TestBed.inject(ProgressUpdateService);
    service.setCurrentStep(3);
    service.setTotalSteps(10);
    service.setEventCompleted(true);
    expect(service.currentStep$()).toBe(3);
    expect(service.totalSteps$()).toBe(10);
    expect(service.eventCompleted$()).toBe(true);
  });

  it('progressUpdate emission updates current and total steps', () => {
    const service = TestBed.inject(ProgressUpdateService);
    progressUpdateSubject.next({ currentStep: 4, totalSteps: 7 });
    expect(service.currentStep$()).toBe(4);
    expect(service.totalSteps$()).toBe(7);
  });

  it('eventCompleted emission flips the flag and resets counters', () => {
    const service = TestBed.inject(ProgressUpdateService);
    service.setCurrentStep(5);
    service.setTotalSteps(9);

    eventCompletedSubject.next({});
    expect(service.eventCompleted$()).toBe(true);
    expect(service.currentStep$()).toBe(0);
    expect(service.totalSteps$()).toBe(0);
  });
});
