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
      eventsGateway as never,
      stepExecutor as never,
      {
        getRecordingDetails: vi.fn().mockResolvedValue({
          steps: [
            { type: BrowserAction.NAVIGATE, url: 'https://example.test' },
            { type: BrowserAction.NAVIGATE, url: 'https://example.test/next' }
          ]
        })
      } as never
    );

    await service.performOperation({} as never, 'project', 'event', {
      localStorage: { data: [] },
      cookie: { data: [] }
    });

    expect(stepExecutor.executeStep).toHaveBeenCalledTimes(2);
    expect(states[1]).toBe(states[0]);
    expect(states[1]?.isFirstNavigation).toBe(false);
    expect(eventsGateway.sendProgressUpdate).toHaveBeenNthCalledWith(1, 2, 1);
    expect(eventsGateway.sendProgressUpdate).toHaveBeenNthCalledWith(2, 2, 2);
    expect(eventsGateway.sendEventCompleted).toHaveBeenCalledWith('event');
  });

  describe('last click protection', () => {
    async function runWithSteps(
      steps: Array<{ type: string; url?: string; selectors?: string[][] }>
    ) {
      const executed: Array<{
        type: string;
        isLastStep: boolean;
        isLastClick: boolean;
      }> = [];
      const stepExecutor = {
        executeStep: vi
          .fn()
          .mockImplementation(
            async (
              _page,
              step: { type: string },
              _projectSlug,
              _eventId,
              _state,
              isLastStep: boolean,
              _application,
              isLastClick: boolean
            ) => {
              executed.push({ type: step.type, isLastStep, isLastClick });
            }
          )
      };
      const service = new ActionService(
        { sendProgressUpdate: vi.fn(), sendEventCompleted: vi.fn() } as never,
        stepExecutor as never,
        {
          getRecordingDetails: vi.fn().mockResolvedValue({ steps })
        } as never
      );
      await service.performOperation({} as never, 'project', 'event', {
        localStorage: { data: [] },
        cookie: { data: [] }
      });
      return executed;
    }

    it('(a) recording ending [navigate, click, waitForElement] protects the click', async () => {
      const executed = await runWithSteps([
        { type: BrowserAction.NAVIGATE, url: 'https://example.test' },
        { type: BrowserAction.CLICK, selectors: [['#btn']] },
        { type: BrowserAction.WAITFORELEMENT, selectors: [['#elem']] }
      ]);
      expect(executed).toEqual([
        { type: BrowserAction.NAVIGATE, isLastStep: false, isLastClick: false },
        { type: BrowserAction.CLICK, isLastStep: false, isLastClick: true },
        {
          type: BrowserAction.WAITFORELEMENT,
          isLastStep: true,
          isLastClick: false
        }
      ]);
    });

    it('(b) with two clicks only the second is protected', async () => {
      const executed = await runWithSteps([
        { type: BrowserAction.CLICK, selectors: [['#first']] },
        { type: BrowserAction.CLICK, selectors: [['#second']] }
      ]);
      expect(executed).toEqual([
        { type: BrowserAction.CLICK, isLastStep: false, isLastClick: false },
        { type: BrowserAction.CLICK, isLastStep: true, isLastClick: true }
      ]);
    });

    it('(c) no click: nothing is protected', async () => {
      const executed = await runWithSteps([
        { type: BrowserAction.NAVIGATE, url: 'https://example.test' },
        { type: BrowserAction.WAITFORELEMENT, selectors: [['#elem']] }
      ]);
      expect(executed).toEqual([
        { type: BrowserAction.NAVIGATE, isLastStep: false, isLastClick: false },
        {
          type: BrowserAction.WAITFORELEMENT,
          isLastStep: true,
          isLastClick: false
        }
      ]);
    });
  });
});
