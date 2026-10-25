import { describe, it, expect, vi } from 'vitest';
import {
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { ChangeHandler } from './change-handler.service';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';
import type { WaitForSelectorOptions } from 'puppeteer';

describe('ChangeHandler', () => {
  function build(opts?: {
    selectorType?: string | undefined;
    changeResult?: boolean;
    changeError?: Error;
  }) {
    const changeStrategyService = {
      changeElement: vi.fn(async () => {
        if (opts?.changeError) throw opts.changeError;
        return opts?.changeResult ?? true;
      })
    } as unknown as ChangeStrategyService;
    const actionUtilsService = {
      getSelectorType: vi.fn(() =>
        opts && 'selectorType' in opts ? opts.selectorType : 'css'
      )
    } as unknown as ActionUtilsService;
    return {
      svc: new ChangeHandler(changeStrategyService, actionUtilsService),
      changeStrategyService,
      actionUtilsService
    };
  }

  describe('changeElement', () => {
    it('returns true when the strategy succeeds', async () => {
      const { svc } = build({ changeResult: true });
      const result = await svc.changeElement({} as never, 'p', 'e', '#x', 'v');
      expect(result).toBe(true);
    });

    it('throws InternalServerErrorException when the selector type is unknown', async () => {
      const { svc } = build({ selectorType: undefined });
      await expect(
        svc.changeElement({} as never, 'p', 'e', '#x', 'v')
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws NotFoundException when the strategy returns false', async () => {
      const { svc } = build({ changeResult: false });
      await expect(
        svc.changeElement({} as never, 'p', 'e', '#x', 'v')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rethrows NotFoundException without wrapping', async () => {
      const original = new NotFoundException('gone');
      const { svc } = build({ changeError: original });
      await expect(
        svc.changeElement({} as never, 'p', 'e', '#x', 'v')
      ).rejects.toBe(original);
    });
  });

  describe('handle', () => {
    /** A page where only the listed selectors exist. */
    function pageWith(...present: string[]) {
      return {
        waitForSelector: vi.fn(
          async (selector: string, _options?: WaitForSelectorOptions) => {
            if (present.includes(selector)) return { dispose: vi.fn() };
            throw Object.assign(new Error(`Waiting for ${selector} failed`), {
              name: 'TimeoutError'
            });
          }
        )
      };
    }

    it('iterates selectors and stops on first successful change', async () => {
      const { svc, changeStrategyService } = build({ changeResult: true });
      const step: Step = {
        selectors: [['#a'], ['#b']],
        value: 'v'
      } as unknown as Step;

      await svc.handle(pageWith('#a', '#b') as never, 'p', 'e', step, false);

      expect(changeStrategyService.changeElement).toHaveBeenCalledTimes(1);
    });

    it('waits for the field to exist, not to be visible, and starts with it', async () => {
      const { svc, changeStrategyService } = build({ changeResult: true });
      const page = pageWith('#second');
      const step: Step = {
        selectors: [['#first'], ['#second']],
        value: 'v'
      } as unknown as Step;

      await svc.handle(page as never, 'p', 'e', step, false);

      for (const [, options] of page.waitForSelector.mock.calls) {
        expect(options).toMatchObject({ visible: false });
      }
      expect(
        vi.mocked(changeStrategyService.changeElement).mock.calls[0][3]
      ).toBe('#second');
    });

    it('falls back to the next selector when one fails', async () => {
      const { svc, changeStrategyService } = build();
      vi.mocked(changeStrategyService.changeElement)
        .mockRejectedValueOnce(new Error('detached'))
        .mockResolvedValueOnce(true);
      const step: Step = {
        selectors: [['#a'], ['#b']],
        value: 'v'
      } as unknown as Step;

      await svc.handle(pageWith('#a', '#b') as never, 'p', 'e', step, false);

      expect(changeStrategyService.changeElement).toHaveBeenCalledTimes(2);
    });

    it('rethrows NotFoundException when every selector fails', async () => {
      const { svc } = build({
        changeError: new NotFoundException('missing')
      });
      const step: Step = {
        selectors: [['#a']],
        value: 'v'
      } as unknown as Step;

      await expect(
        svc.handle(pageWith('#a') as never, 'p', 'e', step, false)
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('fails with NotFoundException when no selector appears in time', async () => {
      const { svc, changeStrategyService } = build();
      const step: Step = {
        selectors: [['#a'], ['#b']],
        value: 'v',
        timeout: 50
      } as unknown as Step;

      await expect(
        svc.handle(pageWith() as never, 'p', 'e', step, false)
      ).rejects.toThrow(/None of the selectors appeared within 50 ms/);
      expect(changeStrategyService.changeElement).not.toHaveBeenCalled();
    });
  });
});
