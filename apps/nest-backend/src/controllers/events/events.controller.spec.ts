import { MessageEvent } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ProgressEventsService } from '../../core/events-gateway/progress-events.service';
import { EventsController } from './events.controller';

describe('EventsController', () => {
  it('streams progressUpdate events with type, payload, and retry 1000', () => {
    const service = new ProgressEventsService();
    const controller = new EventsController(service);
    const emitted: MessageEvent[] = [];

    const subscription = controller.events().subscribe((event) => {
      emitted.push(event);
    });

    service.sendProgressUpdate(8, 2);
    subscription.unsubscribe();

    expect(emitted).toEqual([
      {
        type: 'progressUpdate',
        data: {
          totalSteps: 8,
          currentStep: 2
        },
        retry: 1000
      }
    ]);
  });

  it('streams eventCompleted events with type, payload, and retry 1000', () => {
    const service = new ProgressEventsService();
    const controller = new EventsController(service);
    const emitted: MessageEvent[] = [];

    const subscription = controller.events().subscribe((event) => {
      emitted.push(event);
    });

    service.sendEventCompleted('purchase_flow');
    subscription.unsubscribe();

    expect(emitted).toEqual([
      {
        type: 'eventCompleted',
        data: {
          message: 'purchase_flow'
        },
        retry: 1000
      }
    ]);
  });
});
