import { describe, it, expect, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { StepElementNotFoundError } from '../step-failure/step-element-not-found.error';
import {
  ASSERTED_NAVIGATION_TIMEOUT_MS,
  StepExecutorUtilsService
} from './step-executor-utils.service';
import { DataLayerService } from '../../action/web-monitoring/data-layer/data-layer.service';
import { ConfigsService } from '../../../../core/configs/configs.service';
import type { Step } from '@utils';

describe('StepExecutorUtilsService', () => {
  function build() {
    const dataLayerService = {
      updateSelfDataLayer: vi.fn().mockResolvedValue(undefined)
    } as unknown as DataLayerService;
    const configsService = {
      getUSER_AGENT: () => 'TestUA/1.0'
    } as unknown as ConfigsService;
    return {
      svc: new StepExecutorUtilsService(dataLayerService, configsService),
      dataLayerService,
      configsService
    };
  }

  describe('handleNavigationIfNeeded', () => {
    it('does nothing when isLastStep is false', async () => {
      const { svc } = build();
      const page = { waitForNavigation: vi.fn() } as never;
      await svc.handleNavigationIfNeeded(page, false);
      expect(
        (page as { waitForNavigation: ReturnType<typeof vi.fn> })
          .waitForNavigation
      ).not.toHaveBeenCalled();
    });

    it('waits for navigation and swallows timeout errors when isLastStep is true', async () => {
      const { svc } = build();
      const page = {
        waitForNavigation: vi.fn().mockRejectedValue(new Error('timeout'))
      } as never;
      await svc.handleNavigationIfNeeded(page, true, 1);
      expect(
        (page as { waitForNavigation: ReturnType<typeof vi.fn> })
          .waitForNavigation
      ).toHaveBeenCalled();
    });
  });

  describe('handleSetViewport', () => {
    it('forwards width/height to page.setViewport', async () => {
      const { svc } = build();
      const page = {
        setViewport: vi.fn().mockResolvedValue(undefined)
      } as never;
      await svc.handleSetViewport(page, { width: 800, height: 600 } as never);
      expect(
        (page as { setViewport: ReturnType<typeof vi.fn> }).setViewport
      ).toHaveBeenCalledWith({ width: 800, height: 600 });
    });
  });

  describe('handleKeyboardAction', () => {
    it('handles navigation if needed then updates the data layer', async () => {
      const { svc, dataLayerService } = build();
      const page = { waitForNavigation: vi.fn() } as never;
      await svc.handleKeyboardAction(page, 'p', 'e', false, 1000);
      expect(dataLayerService.updateSelfDataLayer).toHaveBeenCalledWith(
        page,
        'p',
        'e'
      );
    });
  });

  describe('waitForAssertedNavigation', () => {
    it('warns and continues when the navigation times out', async () => {
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      try {
        const { svc } = build();
        const page = {
          waitForNavigation: vi
            .fn()
            .mockRejectedValue(new Error('Navigation timeout'))
        };
        await expect(
          svc.waitForAssertedNavigation(page as never)
        ).resolves.toBeUndefined();
        expect(page.waitForNavigation).toHaveBeenCalledWith({
          timeout: ASSERTED_NAVIGATION_TIMEOUT_MS
        });
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('Asserted navigation did not happen')
        );
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe('handleWaitForElement', () => {
    function elementPage(waitForSelector: ReturnType<typeof vi.fn>) {
      const page = {
        waitForNavigation: vi
          .fn()
          .mockReturnValue(new Promise(() => undefined)),
        waitForSelector,
        close: vi.fn(),
        mainFrame() {
          return page;
        }
      };
      return page;
    }

    it('returns once the first selector resolves', async () => {
      const { svc } = build();
      const page = elementPage(vi.fn().mockResolvedValue({}));
      const step: Step = { selectors: [['#a']] } as unknown as Step;
      await svc.handleWaitForElement(page as never, step, 100);
      expect(page.close).not.toHaveBeenCalled();
    });

    it('throws StepElementNotFoundError (404) and leaves the page open when no selector resolves', async () => {
      // The pipeline screenshots the page to save the failed run.
      const { svc } = build();
      const page = elementPage(vi.fn().mockRejectedValue(new Error('no sel')));
      page.waitForNavigation.mockRejectedValue(new Error('no nav'));
      const step: Step = { selectors: [['#a']] } as unknown as Step;
      const error = await svc
        .handleWaitForElement(page as never, step, 10)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StepElementNotFoundError);
      expect(error).toMatchObject({ selectors: ['#a'], timeoutMs: 10 });
      expect((error as StepElementNotFoundError).getStatus()).toBe(404);
      expect(page.close).not.toHaveBeenCalled();
    });

    it('waits in the recorded frame for a shadow chain', async () => {
      const { svc } = build();
      const child = {
        waitForSelector: vi.fn().mockResolvedValue({}),
        childFrames: () => []
      };
      const page = {
        waitForNavigation: vi
          .fn()
          .mockReturnValue(new Promise(() => undefined)),
        waitForSelector: vi.fn(),
        mainFrame: () => ({ childFrames: () => [child] })
      };
      const step: Step = {
        selectors: [['my-widget', 'button.buy']],
        frame: [0]
      } as unknown as Step;

      await svc.handleWaitForElement(page as never, step, 100);

      expect(page.waitForSelector).not.toHaveBeenCalled();
      expect(child.waitForSelector).toHaveBeenCalledWith(
        'my-widget >>>> button.buy',
        { visible: false, timeout: 100 }
      );
    });

    it('names a frame that never appears, instead of the selectors', async () => {
      const { svc } = build();
      const page = {
        waitForNavigation: vi.fn(),
        waitForSelector: vi.fn(),
        mainFrame: () => ({ childFrames: () => [] })
      };
      const step: Step = {
        selectors: [['#a']],
        frame: [0]
      } as unknown as Step;

      await expect(
        svc.handleWaitForElement(page as never, step, 20)
      ).rejects.toThrow(/Frame \[0\] did not appear within 20 ms/);
      expect(page.waitForSelector).not.toHaveBeenCalled();
    });
  });

  describe('handleNavigate', () => {
    function navigablePage(evaluate: ReturnType<typeof vi.fn>) {
      return {
        setExtraHTTPHeaders: vi.fn().mockResolvedValue(undefined),
        evaluateOnNewDocument: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        evaluate
      };
    }

    it('goes on when the consent preferences cannot be read', async () => {
      vi.useFakeTimers();
      try {
        const { svc } = build();
        // A site that stores consentPreferences as something other than JSON.
        const page = navigablePage(
          vi.fn().mockRejectedValue(new SyntaxError('Unexpected token'))
        );
        const state = { isFirstNavigation: true };
        const step = { type: 'navigate', url: 'https://example.test' } as Step;
        const application = {
          localStorage: { data: [] },
          cookie: { data: [] }
        };

        const navigation = svc.handleNavigate(
          page as never,
          step,
          state,
          false,
          application
        );
        await vi.runAllTimersAsync();
        await navigation;

        expect(page.goto).toHaveBeenCalledTimes(2);
        expect(state.isFirstNavigation).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
