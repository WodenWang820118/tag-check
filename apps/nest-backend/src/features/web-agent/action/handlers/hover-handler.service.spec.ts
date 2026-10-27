import { describe, it, expect, vi } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { HoverHandler } from './hover-handler.service';
import { HoverStrategyService } from '../strategies/hover-strategies/hover-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';

describe('HoverHandler', () => {
  function build(opts?: { hovered?: boolean; selectorType?: string | null }) {
    const page = {
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      mainFrame() {
        return page;
      }
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

  it('hovers a shadow chain inside the recorded frame', async () => {
    const { svc, hoverStrategyService } = build({ hovered: true });
    const child = {
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      childFrames: () => []
    };
    const waitForSelector = vi.fn();
    const page = {
      waitForSelector,
      mainFrame: () => ({ childFrames: () => [child] })
    } as unknown as import('puppeteer').Page;
    const step: Step = {
      selectors: [['my-widget', 'button.buy']],
      frame: [0],
      target: 'main'
    } as unknown as Step;

    await svc.handle(page, 'p', 'e', step, false);

    expect(waitForSelector).not.toHaveBeenCalled();
    expect(child.waitForSelector).toHaveBeenCalledWith(
      'my-widget >>>> button.buy',
      expect.objectContaining({ visible: true })
    );
    expect(hoverStrategyService.hoverElement).toHaveBeenCalledWith(
      child,
      'p',
      'e',
      'my-widget >>>> button.buy',
      'css',
      10000
    );
  });
});
