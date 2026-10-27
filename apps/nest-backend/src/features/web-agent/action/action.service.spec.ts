import { describe, expect, it, vi } from 'vitest';
import { ActionService, FALLBACK_STEP_TIMEOUT_MS } from './action.service';
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
      { selectorsFor: vi.fn().mockReturnValue(null) } as never,
      { record: vi.fn() } as never
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
        { selectorsFor: vi.fn().mockReturnValue(null) } as never,
        { record: vi.fn() } as never
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
      const context = {
        stepIndex: 1,
        selectors: [{ selector: '#gone', matches: 0 }],
        candidates: []
      };
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
        { selectorsFor: vi.fn().mockReturnValue(null) } as never,
        { record: vi.fn() } as never
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
      overrides as never,
      { record: vi.fn() } as never
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

  describe('a fallback when the recorded selectors find nothing', () => {
    const application = {
      localStorage: { data: [] },
      cookie: { data: [] }
    };
    const button = {
      index: 0,
      tag: 'button',
      role: 'button',
      name: 'Add to cart',
      attributes: { 'data-testid': 'add-to-cart' },
      box: { x: 0, y: 0, width: 10, height: 10 },
      selectors: ['[data-testid="add-to-cart"]', 'main > div.new > button']
    };
    const recordedSelector = 'main > div.old > [data-testid="add-to-cart"]';

    function matchingContext(candidates = [button]) {
      return {
        stepIndex: 0,
        selectors: [{ selector: recordedSelector, matches: 0 }],
        candidates
      };
    }

    function clickStep() {
      return {
        type: BrowserAction.CLICK,
        selectors: [[recordedSelector]],
        frame: [0],
        offsetX: 4,
        timeout: 30_000
      };
    }

    type Executed = {
      step: {
        type: string;
        selectors?: (string | string[])[];
        timeout?: number;
        frame?: number[];
        offsetX?: number;
        url?: string;
      };
      isLastStep: boolean;
      isLastClick: boolean;
      onAction?: () => void;
    };

    function run(options: {
      steps: Array<{ type: string; url?: string; selectors?: string[][] }>;
      error: StepElementNotFoundError;
      context?: ReturnType<typeof matchingContext>;
      selectorsFor?: (
        eventId: string,
        index: number
      ) => readonly string[] | null;
      onAttempt?: (attempt: number) => Promise<void> | void;
    }) {
      const record = vi.fn();
      const markStep = vi.fn();
      const completed = vi.fn();
      const executions: Executed[] = [];
      const context = options.context ?? matchingContext();
      const stepExecutor = {
        executeStep: vi.fn(async (execution: Executed) => {
          executions.push(execution);
          if (options.onAttempt) {
            await options.onAttempt(executions.length);
            return;
          }
          if (executions.length === 1) throw options.error;
        })
      };
      const service = new ActionService(
        { sendEventCompleted: completed } as never,
        stepExecutor as never,
        {
          getRecordingDetails: vi.fn().mockResolvedValue({
            steps: options.steps
          })
        } as never,
        { step: vi.fn() } as never,
        { markStep } as never,
        { collect: vi.fn().mockResolvedValue(context) } as never,
        {
          selectorsFor: vi.fn(options.selectorsFor ?? (() => null))
        } as never,
        { record } as never
      );
      const pending = service.performOperation(
        {} as never,
        'project',
        'event',
        application
      );
      return { pending, record, markStep, completed, executions, context };
    }

    it('retries with the candidate selectors and the short timeout, then continues', async () => {
      const error = new StepElementNotFoundError(
        'missing',
        [recordedSelector],
        30_000
      );
      const steps = [
        clickStep(),
        { type: BrowserAction.NAVIGATE, url: 'https://example.test/cart' }
      ];
      const { pending, record, markStep, completed, executions } = run({
        steps,
        error
      });

      await pending;

      expect(FALLBACK_STEP_TIMEOUT_MS).toBe(5_000);
      expect(executions[0]?.step).toBe(steps[0]);
      expect(executions[1]).toMatchObject({
        isLastStep: false,
        isLastClick: true,
        step: {
          type: BrowserAction.CLICK,
          frame: [0],
          offsetX: 4,
          timeout: 5_000,
          selectors: [
            ['[data-testid="add-to-cart"]'],
            ['main > div.new > button']
          ]
        }
      });
      expect(executions[2]?.step).toEqual(steps[1]);
      expect(record).toHaveBeenCalledWith('event', {
        stepIndex: 0,
        stepType: 'click',
        selector: '[data-testid="add-to-cart"]',
        matchedBy: 'testId',
        value: 'add-to-cart'
      });
      executions[1]?.onAction?.();
      expect(markStep).toHaveBeenCalledWith('event', 0);
      expect(completed).toHaveBeenCalledWith('event');
    });

    it('rethrows the original error with its context when the retry throws', async () => {
      const error = new StepElementNotFoundError(
        'missing',
        [recordedSelector],
        30_000
      );
      const { pending, record, completed, executions, context } = run({
        steps: [clickStep()],
        error,
        onAttempt: (attempt) => {
          if (attempt === 1) throw error;
          throw new Error('still missing');
        }
      });

      await expect(pending).rejects.toBe(error);
      expect(error.stepIndex).toBe(0);
      expect(error.context).toBe(context);
      expect(executions).toHaveLength(2);
      expect(record).not.toHaveBeenCalled();
      expect(completed).not.toHaveBeenCalled();
    });

    it('does not retry a step that is trying a trial override', async () => {
      const error = new StepElementNotFoundError(
        'missing',
        ['#chosen'],
        30_000
      );
      const { pending, record, executions } = run({
        steps: [clickStep()],
        error,
        selectorsFor: () => ['#chosen']
      });

      await expect(pending).rejects.toBe(error);
      expect(executions).toHaveLength(1);
      expect(executions[0]?.step.selectors).toEqual([['#chosen']]);
      expect(record).not.toHaveBeenCalled();
    });

    it('does not retry a step type that does not look for an element', async () => {
      const error = new StepElementNotFoundError('missing', [], 30_000);
      const { pending, record, executions } = run({
        steps: [{ type: BrowserAction.NAVIGATE, url: 'https://example.test' }],
        error
      });

      await expect(pending).rejects.toBe(error);
      expect(executions).toHaveLength(1);
      expect(record).not.toHaveBeenCalled();
    });

    it('does not retry when the rule finds no single candidate', async () => {
      const error = new StepElementNotFoundError(
        'missing',
        [recordedSelector],
        30_000
      );
      const twin = { ...button, index: 1 };
      const { pending, record, executions } = run({
        steps: [clickStep()],
        error,
        context: matchingContext([button, twin])
      });

      await expect(pending).rejects.toBe(error);
      expect(executions).toHaveLength(1);
      expect(record).not.toHaveBeenCalled();
    });
  });
});
