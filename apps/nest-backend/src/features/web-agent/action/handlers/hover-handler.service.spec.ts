import { describe, it, expect, vi } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { HoverHandler } from './hover-handler.service';
import { HoverStrategyService } from '../strategies/hover-strategies/hover-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';

describe('HoverHandler', () => {
  function build(opts?: { hovered?: boolean; selectorType?: string | null }) {
    const page = {
      waitForSelector: vi.fn().mockResolvedValue(undefined)
    } as unknown as import('puppeteer').Page;
    const hoverStrategyService = {
      hoverElement: vi.fn().mockResolvedValue(opts?.hovered ?? true)
    } as unknown as HoverStrategyService;
    const actionUtilsService = {
      getSelectorType: vi.fn(() =>
        opts && 'selectorType' in opts ? opts.selectorType : 'css'
      )
    } as unknown as ActionUtilsService;
    return {
      svc: new HoverHandler(hoverStrategyService, actionUtilsService),
      page,
      hoverStrategyService
    };
  }

  it('stops at the first selector that hovers successfully', async () => {
    const { svc, page, hoverStrategyService } = build({ hovered: true });
    const step: Step = {
      selectors: [['#a'], ['#b']],
      target: 'main'
    } as unknown as Step;

    await svc.handle(page, 'p', 'e', step, false);

    expect(hoverStrategyService.hoverElement).toHaveBeenCalledTimes(1);
  });

  it('throws InternalServerErrorException when no selector hovers', async () => {
    const { svc, page } = build({ hovered: false });
    const step: Step = {
      selectors: [['#a']],
      target: 'main'
    } as unknown as Step;

    await expect(
      svc.handle(page, 'p', 'e', step, false)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
