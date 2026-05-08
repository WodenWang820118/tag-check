import { describe, it, expect, vi } from 'vitest';
import { ClickStrategyService } from './click-strategy.service';
import { PageClickService } from './page-click.service';
import { EvaluateClickService } from './evaluate-click.service';

describe('ClickStrategyService', () => {
  function build(opts?: { pageResult?: boolean; evalResult?: boolean }) {
    const pageClickService = {
      operate: vi.fn().mockResolvedValue(opts?.pageResult ?? true)
    } as unknown as PageClickService;
    const evaluateClickService = {
      operate: vi.fn().mockResolvedValue(opts?.evalResult ?? true)
    } as unknown as EvaluateClickService;
    const svc = new ClickStrategyService(
      pageClickService,
      evaluateClickService
    );
    return { svc, pageClickService, evaluateClickService };
  }

  it('uses the page click service when useNormalClick is true', async () => {
    const { svc, pageClickService, evaluateClickService } = build({
      pageResult: true
    });
    const result = await svc.clickElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      true
    );
    expect(result).toBe(true);
    expect(pageClickService.operate).toHaveBeenCalled();
    expect(evaluateClickService.operate).not.toHaveBeenCalled();
  });

  it('uses the evaluate click service when useNormalClick is false', async () => {
    const { svc, pageClickService, evaluateClickService } = build({
      evalResult: true
    });
    const result = await svc.clickElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      false
    );
    expect(result).toBe(true);
    expect(evaluateClickService.operate).toHaveBeenCalled();
    expect(pageClickService.operate).not.toHaveBeenCalled();
  });

  it('falls back to evaluate when page click returns false', async () => {
    const { svc, pageClickService, evaluateClickService } = build({
      pageResult: false,
      evalResult: true
    });
    const result = await svc.clickElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      true
    );
    expect(result).toBe(true);
    expect(pageClickService.operate).toHaveBeenCalled();
    expect(evaluateClickService.operate).toHaveBeenCalled();
  });

  it('returns false when click throws', async () => {
    const { svc, pageClickService } = build();
    (pageClickService.operate as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('boom')
    );
    const result = await svc.clickElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      true
    );
    expect(result).toBe(false);
  });
});
