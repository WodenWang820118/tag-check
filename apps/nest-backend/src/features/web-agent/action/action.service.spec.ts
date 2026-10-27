import { describe, expect, it, vi } from 'vitest';
import { ActionService } from './action.service';
import { BrowserAction } from './action-utils';
import { StepElementNotFoundError } from './step-failure/step-element-not-found.error';

describe('ActionService', () => {
  it('keeps first-navigation state across operation steps', async () => {
    const states: Array<{ isFirstNavigation: boolean }> = [];
    const eventsGateway = { sendEventCompleted: vi.fn() };
    const runStatus = { step: vi.fn() };
    const runTimeline = { markStep: vi.fn() };
    const stepExecutor = {
      executeStep: vi
        .fn()
        .mockImplementation(
          async ({
            state,
            onAction
          }: {
            state: { isFirstNavigation: boolean };
            onAction: () => void;
          }) => {
            states.push(state);
            state.isFirstNavigation = false;
            onAction();
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
      } as never,
      runStatus as never,
      runTimeline as never,
      { collect: vi.fn() } as never,
      { selectorsFor: vi.fn().mockReturnValue(null) } as never
    );

    await service.performOperation({} as never, 'project', 'event', {
      localStorage: { data: [] },
      cookie: { data: [] }
    });

    expect(stepExecutor.executeStep).toHaveBeenCalledTimes(2);
    expect(states[1]).toBe(states[0]);
    expect(states[1]?.isFirstNavigation).toBe(false);
    expect(runStatus.step).toHaveBeenNthCalledWith(1, 'event', 2, 1);
    expect(runStatus.step).toHaveBeenNthCalledWith(2, 'event', 2, 2);
    expect(eventsGateway.sendEventCompleted).toHaveBeenCalledWith('event');
    expect(runTimeline.markStep).toHaveBeenNthCalledWith(1, 'event', 0);
    expect(runTimeline.markStep).toHaveBeenNthCalledWith(2, 'event', 1);
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
            async ({
              step,
              isLastStep,
              isLastClick
            }: {
              step: { type: string };
              isLastStep: boolean;
              isLastClick: boolean;
            }) => {
              executed.push({ type: step.type, isLastStep, isLastClick });
            }
          )
      };
      const service = new ActionService(
        { sendEventCompleted: vi.fn() } as never,
        stepExecutor as never,
        {
          getRecordingDetails: vi.fn().mockResolvedValue({ steps })
        } as never,
        { step: vi.fn() } as never,
        { markStep: vi.fn() } as never,
        { collect: vi.fn() } as never,
        { selectorsFor: vi.fn().mockReturnValue(null) } as never
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
  describe('a step that cannot find its element', () => {
    function build(error: Error) {
      const steps = [
        { type: BrowserAction.NAVIGATE, url: 'https://example.test' },
        { type: BrowserAction.CLICK, selectors: [['#gone']] }
      ];
      const context = { stepIndex: 1 };
      const collector = { collect: vi.fn().mockResolvedValue(context) };
      const stepExecutor = {
        executeStep: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(error)
      };
      const service = new ActionService(
        { sendEventCompleted: vi.fn() } as never,
        stepExecutor as never,
        { getRecordingDetails: vi.fn().mockResolvedValue({ steps }) } as never,
        { step: vi.fn() } as never,
        { markStep: vi.fn() } as never,
        collector as never,
        { selectorsFor: vi.fn().mockReturnValue(null) } as never
      );
      const run = service.performOperation(
        { url: () => 'page' } as never,
        'project',
        'event',
        { localStorage: { data: [] }, cookie: { data: [] } }
      );
      return { run, collector, steps, context };
    }

    it('rejects with its index and what the page showed', async () => {
      const error = new StepElementNotFoundError('missing', ['#gone'], 15000);
      const { run, collector, steps, context } = build(error);

      await expect(run).rejects.toBe(error);
      expect(error.stepIndex).toBe(1);
      expect(error.context).toBe(context);
      expect(collector.collect).toHaveBeenCalledWith(
        expect.anything(),
        steps[1],
        1,
        15000
      );
    });

    it('rejects with any other error as it is', async () => {
      const error = new Error('page crashed');
      const { run, collector } = build(error);

      await expect(run).rejects.toBe(error);
      expect(collector.collect).not.toHaveBeenCalled();
    });
  });

  it("replays a trial's step with the selectors it tries", async () => {
    const executed: unknown[] = [];
    const stepExecutor = {
      executeStep: vi.fn(async ({ step }: { step: unknown }) => {
        executed.push(step);
      })
    };
    const steps = [
      { type: BrowserAction.NAVIGATE, url: 'https://example.test' },
      { type: BrowserAction.CLICK, selectors: [['#gone']], offsetX: 3 }
    ];
    const overrides = {
      selectorsFor: vi.fn((_eventId: string, index: number) =>
        index === 1 ? ['#new', 'aria/New'] : null
      )
    };
    const service = new ActionService(
      { sendEventCompleted: vi.fn() } as never,
      stepExecutor as never,
      { getRecordingDetails: vi.fn().mockResolvedValue({ steps }) } as never,
      { step: vi.fn() } as never,
      { markStep: vi.fn() } as never,
      { collect: vi.fn() } as never,
      overrides as never
    );

    await service.performOperation({} as never, 'project', 'event', {
      localStorage: { data: [] },
      cookie: { data: [] }
    });

    expect(executed).toEqual([
      steps[0],
      {
        type: BrowserAction.CLICK,
        selectors: [['#new'], ['aria/New']],
        offsetX: 3
      }
    ]);
    expect(overrides.selectorsFor).toHaveBeenCalledWith('event', 1);
  });
});
