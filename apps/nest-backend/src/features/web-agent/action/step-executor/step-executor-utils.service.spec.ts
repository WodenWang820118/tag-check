import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { StepExecutorUtilsService } from './step-executor-utils.service';
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

  describe('handleWaitForElement', () => {
    it('returns once the first selector resolves', async () => {
      const { svc } = build();
      const page = {
        waitForNavigation: vi
          .fn()
          .mockReturnValue(new Promise(() => undefined)),
        waitForSelector: vi.fn().mockResolvedValue({}),
        close: vi.fn()
      } as never;
      const step: Step = { selectors: [['#a']] } as unknown as Step;
      await svc.handleWaitForElement(page, step, 100);
      expect(
        (page as { close: ReturnType<typeof vi.fn> }).close
      ).not.toHaveBeenCalled();
    });

    it('throws NotFoundException and leaves the page open when no selector resolves', async () => {
      // The pipeline screenshots the page to save the failed run.
      const { svc } = build();
      const close = vi.fn();
      const page = {
        waitForNavigation: vi.fn().mockRejectedValue(new Error('no nav')),
        waitForSelector: vi.fn().mockRejectedValue(new Error('no sel')),
        close
      } as never;
      const step: Step = { selectors: [['#a']] } as unknown as Step;
      await expect(
        svc.handleWaitForElement(page, step, 10)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(close).not.toHaveBeenCalled();
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
