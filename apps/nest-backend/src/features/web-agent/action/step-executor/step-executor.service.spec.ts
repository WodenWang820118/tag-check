import { describe, expect, it, vi } from 'vitest';
import { BrowserAction } from '../action-utils';
import { StepExecutorService } from './step-executor.service';
import { StepExecutorUtilsService } from './step-executor-utils.service';

function testEvents(stopNavigation = false) {
  return {
    getEntityBySlugAndEventId: vi.fn(async () => ({ stopNavigation }))
  };
}

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
      utils as never,
      testEvents() as never
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
        } as never,
        testEvents() as never
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
      utils as never,
      testEvents() as never
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
      handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined),
      waitForAssertedNavigation: vi.fn().mockResolvedValue(undefined)
    };
    const handler = {
      handle: vi.fn().mockResolvedValue(undefined)
    };
    const events = testEvents(true);
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      utils as never,
      events as never
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
    expect(events.getEntityBySlugAndEventId).not.toHaveBeenCalled();
    expect(utils.handleNavigationIfNeeded).not.toHaveBeenCalled();
    expect(utils.waitForAssertedNavigation).not.toHaveBeenCalled();
  });

  it('forwards isLastClick to the action handler', async () => {
    const page = createPage();
    const handler = { handle: vi.fn().mockResolvedValue(undefined) };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      {
        handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined)
      } as never,
      testEvents() as never
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

  it.each([BrowserAction.CLICK, BrowserAction.CHANGE])(
    'starts an asserted navigation wait before a %s',
    async (type) => {
      const page = createPage();
      const order: string[] = [];
      const utils = {
        waitForAssertedNavigation: vi.fn(() => {
          order.push('wait');
          return Promise.resolve();
        }),
        handleNavigationIfNeeded: vi.fn()
      };
      const handler = {
        handle: vi.fn(async () => {
          order.push('action');
        })
      };
      const service = new StepExecutorService(
        { [type]: handler },
        { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
        utils as never,
        testEvents() as never
      );

      await service.handleDefaultAction(
        page as never,
        { type, assertedEvents: [{ type: 'navigation' }] },
        'project',
        'event',
        false,
        0
      );

      expect(order).toEqual(['wait', 'action']);
      expect(utils.waitForAssertedNavigation).toHaveBeenCalledWith(page);
      expect(utils.handleNavigationIfNeeded).not.toHaveBeenCalled();
    }
  );

  it('continues after an asserted navigation times out', async () => {
    const order: string[] = [];
    let rejectNavigation: (error: Error) => void = () => undefined;
    const pending = new Promise<void>((_resolve, reject) => {
      rejectNavigation = reject;
    });
    const page = {
      ...createPage(),
      waitForNavigation: vi.fn(() => {
        order.push('wait');
        return pending;
      })
    };
    const handler = {
      handle: vi.fn(async () => {
        order.push('click');
      })
    };
    const dataLayer = {
      updateSelfDataLayer: vi.fn(async () => {
        order.push('data');
      })
    };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      dataLayer as never,
      new StepExecutorUtilsService(
        { updateSelfDataLayer: vi.fn() } as never,
        { getUSER_AGENT: () => 'ua' } as never
      ),
      testEvents() as never
    );

    const running = service.handleDefaultAction(
      page as never,
      {
        type: BrowserAction.CLICK,
        assertedEvents: [{ type: 'navigation' }]
      },
      'project',
      'event',
      false,
      0
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual(['wait', 'click']);

    rejectNavigation(new Error('Navigation timeout of 5000 ms exceeded'));
    await running;

    expect(order).toEqual(['wait', 'click', 'data']);
    expect(page.waitForNavigation).toHaveBeenCalledWith({ timeout: 5000 });
  });

  function stopNavigationService(stopNavigation: boolean) {
    const events = testEvents(stopNavigation);
    const utils = {
      handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined),
      waitForAssertedNavigation: vi.fn().mockResolvedValue(undefined)
    };
    const handler = { handle: vi.fn().mockResolvedValue(undefined) };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      utils as never,
      events as never
    );
    return { service, events, utils, handler };
  }

  const navigatingClick = {
    type: BrowserAction.CLICK,
    assertedEvents: [{ type: 'navigation' }]
  };

  it('skips the asserted wait for a last click that stopNavigation prevents', async () => {
    const { service, events, utils, handler } = stopNavigationService(true);

    await service.handleDefaultAction(
      createPage() as never,
      navigatingClick,
      'project',
      'event',
      false,
      0,
      true
    );

    expect(events.getEntityBySlugAndEventId).toHaveBeenCalledWith(
      'project',
      'event'
    );
    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(utils.waitForAssertedNavigation).not.toHaveBeenCalled();
  });

  it('keeps the last step wait, which gives the tags time, under stopNavigation', async () => {
    const { service, utils } = stopNavigationService(true);

    await service.handleDefaultAction(
      createPage() as never,
      navigatingClick,
      'project',
      'event',
      true,
      0,
      true
    );

    expect(utils.handleNavigationIfNeeded).toHaveBeenCalledTimes(1);
    expect(utils.waitForAssertedNavigation).not.toHaveBeenCalled();
  });

  it('keeps the last-step navigation wait when the click is allowed to navigate', async () => {
    const page = createPage();
    const utils = {
      handleNavigationIfNeeded: vi.fn().mockResolvedValue(undefined),
      waitForAssertedNavigation: vi.fn().mockResolvedValue(undefined)
    };
    const handler = { handle: vi.fn().mockResolvedValue(undefined) };
    const service = new StepExecutorService(
      { [BrowserAction.CLICK]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      utils as never,
      testEvents(false) as never
    );

    await service.handleDefaultAction(
      page as never,
      {
        type: BrowserAction.CLICK,
        assertedEvents: [{ type: 'navigation' }]
      },
      'project',
      'event',
      true,
      0,
      true
    );

    expect(utils.handleNavigationIfNeeded).toHaveBeenCalledWith(page, true);
    expect(utils.waitForAssertedNavigation).not.toHaveBeenCalled();
  });

  it('does not wait for navigation on a hover that asserts one', async () => {
    const page = createPage();
    const utils = {
      handleNavigationIfNeeded: vi.fn(),
      waitForAssertedNavigation: vi.fn()
    };
    const handler = { handle: vi.fn().mockResolvedValue(undefined) };
    const service = new StepExecutorService(
      { [BrowserAction.HOVER]: handler },
      { updateSelfDataLayer: vi.fn().mockResolvedValue(undefined) } as never,
      utils as never,
      testEvents() as never
    );

    await service.handleDefaultAction(
      page as never,
      {
        type: BrowserAction.HOVER,
        assertedEvents: [{ type: 'navigation' }]
      },
      'project',
      'event',
      false,
      0
    );

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(utils.waitForAssertedNavigation).not.toHaveBeenCalled();
    expect(utils.handleNavigationIfNeeded).not.toHaveBeenCalled();
  });

  it('starts an asserted navigation wait before a key is released', async () => {
    const order: string[] = [];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const page = createPage();
    page.keyboard.up.mockImplementation(async () => {
      order.push('up');
      return undefined;
    });
    const utils = {
      waitForAssertedNavigation: vi.fn(() => {
        order.push('wait');
        return gate;
      }),
      handleKeyboardAction: vi.fn(async () => {
        order.push('after');
      })
    };
    const service = new StepExecutorService(
      {},
      { updateSelfDataLayer: vi.fn() } as never,
      utils as never,
      testEvents() as never
    );

    const running = service.executeStep({
      page: page as never,
      step: {
        type: BrowserAction.KEYUP,
        key: 'Enter',
        assertedEvents: [{ type: 'navigation' }]
      },
      projectSlug: 'project',
      eventId: 'event',
      state: { isFirstNavigation: false },
      isLastStep: false,
      application: {} as never
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual(['wait', 'up']);

    release();
    await running;
    expect(order).toEqual(['wait', 'up', 'after']);
    expect(utils.handleKeyboardAction).toHaveBeenCalledWith(
      page,
      'project',
      'event',
      false,
      expect.any(Number)
    );
  });

  it('leaves the last key-up on its existing navigation wait', async () => {
    const page = createPage();
    const utils = {
      waitForAssertedNavigation: vi.fn(),
      handleKeyboardAction: vi.fn().mockResolvedValue(undefined)
    };
    const service = new StepExecutorService(
      {},
      { updateSelfDataLayer: vi.fn() } as never,
      utils as never,
      testEvents() as never
    );

    await service.executeStep({
      page: page as never,
      step: {
        type: BrowserAction.KEYUP,
        key: 'Enter',
        assertedEvents: [{ type: 'navigation' }]
      },
      projectSlug: 'project',
      eventId: 'event',
      state: { isFirstNavigation: false },
      isLastStep: true,
      application: {} as never
    });

    expect(utils.waitForAssertedNavigation).not.toHaveBeenCalled();
    expect(utils.handleKeyboardAction).toHaveBeenCalledWith(
      page,
      'project',
      'event',
      true,
      expect.any(Number)
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
