import { describe, expect, it, vi } from 'vitest';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { events } from './events/events';

describe('ExampleEventsBuilderService', () => {
  it('flattens the example events fixture and forwards them to ProjectEventsBuilderService', async () => {
    const projectEventsBuilderService = {
      buildEvents: vi.fn().mockResolvedValue(undefined)
    };
    const service = new ExampleEventsBuilderService(
      projectEventsBuilderService as never
    );

    await service.buildEvents('demo');

    expect(projectEventsBuilderService.buildEvents).toHaveBeenCalledOnce();
    const [slug, inputs, variables] =
      projectEventsBuilderService.buildEvents.mock.calls[0];
    expect(slug).toBe('demo');
    expect(variables).toContainEqual(
      expect.objectContaining({ name: 'DLV - ecommerce.value', type: 'v' })
    );
    const expectedKeys = [
      'eventName',
      'testName',
      'recording',
      'spec',
      'fullItemDef'
    ];
    expect(inputs).toHaveLength(Object.keys(events).length);
    for (const input of inputs as Array<Record<string, unknown>>) {
      for (const key of expectedKeys) {
        expect(input).toHaveProperty(key);
      }
    }
  });
});
