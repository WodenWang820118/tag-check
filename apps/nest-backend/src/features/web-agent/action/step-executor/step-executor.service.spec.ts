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
