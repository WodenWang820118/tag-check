import { describe, expect, it, vi } from 'vitest';
import { ActionService } from './action.service';
import { BrowserAction } from './action-utils';

describe('ActionService', () => {
  it('keeps first-navigation state across operation steps', async () => {
    const states: Array<{ isFirstNavigation: boolean }> = [];
    const eventsGateway = {
      sendProgressUpdate: vi.fn(),
      sendEventCompleted: vi.fn()
    };
    const stepExecutor = {
      executeStep: vi
        .fn()
        .mockImplementation(
          async (
            _page,
            _step,
            _projectSlug,
            _eventId,
            state: { isFirstNavigation: boolean }
          ) => {
            states.push(state);
            state.isFirstNavigation = false;
          }
        )
    };
    const service = new ActionService(
      eventsGateway as any,
      stepExecutor as any,
      {
        getRecordingDetails: vi.fn().mockResolvedValue({
          steps: [
            { type: BrowserAction.NAVIGATE, url: 'https://example.test' },
            { type: BrowserAction.NAVIGATE, url: 'https://example.test/next' }
          ]
        })
      } as any
    );

    await service.performOperation({} as any, 'project', 'event', {
      localStorage: { data: [] },
      cookie: { data: [] }
    } as any);

    expect(stepExecutor.executeStep).toHaveBeenCalledTimes(2);
    expect(states[1]).toBe(states[0]);
    expect(states[1]?.isFirstNavigation).toBe(false);
    expect(eventsGateway.sendProgressUpdate).toHaveBeenNthCalledWith(1, 2, 1);
    expect(eventsGateway.sendProgressUpdate).toHaveBeenNthCalledWith(2, 2, 2);
    expect(eventsGateway.sendEventCompleted).toHaveBeenCalledWith('event');
  });
});
