import { describe, it, expect, vi } from 'vitest';
import {
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { ChangeHandler } from './change-handler.service';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';

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
        'selectorType' in (opts ?? {}) ? opts!.selectorType : 'css'
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
    it('iterates selectors and stops on first successful change', async () => {
      const { svc, changeStrategyService } = build({ changeResult: true });
      const step: Step = {
        selectors: [['#a'], ['#b']],
        value: 'v'
      } as unknown as Step;

      await svc.handle({} as never, 'p', 'e', step, false);

      expect(changeStrategyService.changeElement).toHaveBeenCalledTimes(1);
    });

    it('rethrows NotFoundException raised inside the loop', async () => {
      const { svc } = build({
        changeError: new NotFoundException('missing')
      });
      const step: Step = {
        selectors: [['#a']],
        value: 'v'
      } as unknown as Step;

      await expect(
        svc.handle({} as never, 'p', 'e', step, false)
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
