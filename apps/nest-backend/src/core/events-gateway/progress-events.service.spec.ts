import { MessageEvent } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ProgressEventsService } from './progress-events.service';

describe('ProgressEventsService', () => {
  it('emits a progressUpdate event with totalSteps, currentStep, and retry 1000', () => {
    const service = new ProgressEventsService();
    const emitted: MessageEvent[] = [];

    const subscription = service.events$.subscribe((event) => {
      emitted.push(event);
    });

    service.sendProgressUpdate(10, 3);
    subscription.unsubscribe();

    expect(emitted).toEqual([
      {
        type: 'progressUpdate',
        data: {
          totalSteps: 10,
          currentStep: 3
        },
        retry: 1000
      }
    ]);
  });

  it('emits a batchUpdate event with the batch and its items', () => {
    const service = new ProgressEventsService();
    const emitted: MessageEvent[] = [];

    const subscription = service.events$.subscribe((event) => {
      emitted.push(event);
    });

    service.sendBatchUpdate({
      batchId: 4,
      projectSlug: 'shop',
      status: 'running',
      items: [
        { eventId: 'evt-1', status: 'passed', message: null },
        { eventId: 'evt-2', status: 'running', message: null }
      ]
    });
    subscription.unsubscribe();

    expect(emitted).toEqual([
      {
        type: 'batchUpdate',
        data: {
          batchId: 4,
          projectSlug: 'shop',
          status: 'running',
          items: [
            { eventId: 'evt-1', status: 'passed', message: null },
            { eventId: 'evt-2', status: 'running', message: null }
          ]
        },
        retry: 1000
      }
    ]);
  });

  it('emits an eventCompleted event with message payload and retry 1000', () => {
    const service = new ProgressEventsService();
    const emitted: MessageEvent[] = [];

    const subscription = service.events$.subscribe((event) => {
      emitted.push(event);
    });

    service.sendEventCompleted('test-event-id');
    subscription.unsubscribe();

    expect(emitted).toEqual([
      {
        type: 'eventCompleted',
        data: {
          message: 'test-event-id'
        },
        retry: 1000
      }
    ]);
  });
});
