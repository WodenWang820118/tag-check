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
      { updateSelfDataLayer: vi.fn() } as any,
      utils as any
    );

    await service.executeStep(
      page as any,
      { type: BrowserAction.KEYDOWN, key: 'Enter' } as any,
      'project',
      'event',
      { isFirstNavigation: false },
      false,
      {} as any
    );
    await service.executeStep(
      page as any,
      { type: BrowserAction.KEYUP, key: 'Enter' } as any,
      'project',
      'event',
      { isFirstNavigation: false },
      true,
      {} as any
    );

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
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as any,
      utils as any
    );

    await service.handleDefaultAction(
      page as any,
      { type: BrowserAction.CLICK } as any,
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
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as any,
      utils as any
    );

    await service.handleDefaultAction(
      page as any,
      { type: BrowserAction.CLICK } as any,
      'project',
      'event',
      false,
      0
    );

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(utils.handleNavigationIfNeeded).not.toHaveBeenCalled();
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
