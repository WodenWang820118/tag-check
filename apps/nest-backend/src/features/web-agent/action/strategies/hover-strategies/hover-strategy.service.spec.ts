import { describe, it, expect, vi } from 'vitest';
import { HoverStrategyService } from './hover-strategy.service';
import { PageHoverService } from './page-hover.service';
import { EvaluateHoverService } from './evaluate-hover.service';

describe('HoverStrategyService', () => {
  function build(opts?: { pageResult?: boolean; evalResult?: boolean }) {
    const pageHoverService = {
      operate: vi.fn().mockResolvedValue(opts?.pageResult ?? true)
    } as unknown as PageHoverService;
    const evaluateHoverService = {
      operate: vi.fn().mockResolvedValue(opts?.evalResult ?? true)
    } as unknown as EvaluateHoverService;
    const svc = new HoverStrategyService(
      pageHoverService,
      evaluateHoverService
    );
    return { svc, pageHoverService, evaluateHoverService };
  }

  it('returns true and calls the primary hover service when it succeeds', async () => {
    const { svc, pageHoverService, evaluateHoverService } = build({
      pageResult: true
    });
    const result = await svc.hoverElement({} as never, 'p', 'e', '#sel', 'css');
    expect(result).toBe(true);
    expect(pageHoverService.operate).toHaveBeenCalled();
    expect(evaluateHoverService.operate).not.toHaveBeenCalled();
  });

  it('falls back to the evaluate service when the primary returns false', async () => {
    const { svc, pageHoverService, evaluateHoverService } = build({
      pageResult: false,
      evalResult: true
    });
    const result = await svc.hoverElement({} as never, 'p', 'e', '#sel', 'css');
    expect(result).toBe(true);
    expect(pageHoverService.operate).toHaveBeenCalled();
    expect(evaluateHoverService.operate).toHaveBeenCalled();
  });

  it('returns false when the primary service throws', async () => {
    const { svc, pageHoverService } = build();
    (pageHoverService.operate as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('nope')
    );
    const result = await svc.hoverElement({} as never, 'p', 'e', '#sel', 'css');
    expect(result).toBe(false);
  });
});
