import { describe, expect, it, vi } from 'vitest';
import { BrowserAction } from '../action-utils';
import { StepExecutorService } from './step-executor.service';

describe('StepExecutorService', () => {
  it('executes shared keyDown and keyUp browser actions', async () => {
    const page = createPage();
    const utils = {
      handleSetViewport: vi.fn(),
      handleNavigate: vi.fn(),
      handleWaitForElement: vi.fn(),
      handleKeyboardAction: vi.fn().mockResolvedValue(undefined)
    };
    const service = new StepExecutorService(
      {},
      { updateSelfDataLayer: vi.fn() } as never,
      utils as never
    );

    await service.executeStep({
      page: page as never,
      step: { type: BrowserAction.KEYDOWN, key: 'Enter' },
      projectSlug: 'project',
      eventId: 'event',
      state: { isFirstNavigation: false },
      isLastStep: false,
      application: {} as never
    });
    await service.executeStep({
      page: page as never,
      step: { type: BrowserAction.KEYUP, key: 'Enter' },
      projectSlug: 'project',
      eventId: 'event',
      state: { isFirstNavigation: false },
      isLastStep: true,
      application: {} as never
    });

    expect(page.keyboard.down).toHaveBeenCalledWith('Enter');
    expect(page.keyboard.up).toHaveBeenCalledWith('Enter');
    expect(utils.handleKeyboardAction).toHaveBeenCalledWith(
      page,
      'project',
      'event',
      true,
      expect.any(Number)
    );
  });

  it('marks a click when it acts, after its wait, and a navigation at once', async () => {
    vi.useFakeTimers();
    try {
      const page = createPage();
      const events: string[] = [];
      const handler = {
        handle: vi.fn(async () => {
          events.push('click');
        })
      };
      const service = new StepExecutorService(
        { click: handler },
        { updateSelfDataLayer: vi.fn() } as never,
        {
          handleNavigate: vi.fn(async () => {
            events.push('navigate');
          }),
          handleNavigationIfNeeded: vi.fn()
        } as never
      );
      const replay = {
        page: page as never,
        projectSlug: 'project',
        eventId: 'event',
        state: { isFirstNavigation: true },
        isLastStep: false,
        application: {} as never
      };

      await service.executeStep({
        ...replay,
        step: { type: BrowserAction.NAVIGATE, url: 'https://shop.example' },
        onAction: () => events.push('mark navigate')
      });
      const click = service.executeStep({
        ...replay,
        step: { type: BrowserAction.CLICK, selectors: [['#buy']] },
        onAction: () => events.push('mark click')
      });
      expect(events).toEqual(['mark navigate', 'navigate']);
      await vi.advanceTimersByTimeAsync(5000);
      await click;

      expect(events).toEqual([
        'mark navigate',
        'navigate',
        'mark click',
        'click'
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts final-step navigation waiting before invoking the action handler', async () => {
    const page = createPage();
    const utils = {
      handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined)
    };
    const handler = {
      handle: vi.fn().mockImplementation(async () => {
        expect(utils.handleNavigationIfNeeded).toHaveBeenCalledTimes(1);
      })
    };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      utils as never
    );

    await service.handleDefaultAction(
      page as never,
      { type: BrowserAction.CLICK },
      'project',
      'event',
      true,
      0
    );

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(utils.handleNavigationIfNeeded).toHaveBeenCalledWith(page, true);
  });

  it('does not start navigation waiting for non-final default actions', async () => {
    const page = createPage();
    const utils = {
      handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined)
    };
    const handler = {
      handle: vi.fn().mockResolvedValue(undefined)
    };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      utils as never
    );

    await service.handleDefaultAction(
      page as never,
      { type: BrowserAction.CLICK },
      'project',
      'event',
      false,
      0
    );

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(utils.handleNavigationIfNeeded).not.toHaveBeenCalled();
  });

  it('forwards isLastClick to the action handler', async () => {
    const page = createPage();
    const handler = { handle: vi.fn().mockResolvedValue(undefined) };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      {
        handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined)
      } as never
    );

    await service.handleDefaultAction(
      page as never,
      { type: BrowserAction.CLICK },
      'project',
      'event',
      false,
      0,
      true
    );

    expect(handler.handle).toHaveBeenCalledWith(
      page,
      'project',
      'event',
      { type: BrowserAction.CLICK },
      true
    );
  });
});

function createPage() {
  return {
    keyboard: {
      down: vi.fn().mockResolvedValue(undefined),
      up: vi.fn().mockResolvedValue(undefined)
    }
  };
}
