import { describe, it, expect, vi } from 'vitest';
import { ChangeStrategyService } from './change-strategy.service';
import { PageChangeService } from './page-change.service';
import { EvaluateChangeService } from './evaluate-change.service';

describe('ChangeStrategyService', () => {
  function build(opts?: { pageResult?: boolean; evalResult?: boolean }) {
    const pageChangeService = {
      operate: vi.fn().mockResolvedValue(opts?.pageResult ?? true)
    } as unknown as PageChangeService;
    const evaluateChangeService = {
      operate: vi.fn().mockResolvedValue(opts?.evalResult ?? true)
    } as unknown as EvaluateChangeService;
    const svc = new ChangeStrategyService(
      pageChangeService,
      evaluateChangeService
    );
    return { svc, pageChangeService, evaluateChangeService };
  }

  it('returns false when value is missing', async () => {
    const { svc, pageChangeService } = build();
    const result = await svc.changeElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      undefined
    );
    expect(result).toBe(false);
    expect(pageChangeService.operate).not.toHaveBeenCalled();
  });

  it('returns true and uses the page service when it succeeds', async () => {
    const { svc, pageChangeService, evaluateChangeService } = build({
      pageResult: true
    });
    const result = await svc.changeElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      'val'
    );
    expect(result).toBe(true);
    expect(pageChangeService.operate).toHaveBeenCalled();
    expect(evaluateChangeService.operate).not.toHaveBeenCalled();
  });

  it('falls back to evaluate when page service returns false', async () => {
    const { svc, pageChangeService, evaluateChangeService } = build({
      pageResult: false,
      evalResult: true
    });
    const result = await svc.changeElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      'val'
    );
    expect(result).toBe(true);
    expect(evaluateChangeService.operate).toHaveBeenCalled();
  });

  it('returns false when change throws', async () => {
    const { svc, pageChangeService } = build();
    (pageChangeService.operate as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('nope')
    );
    const result = await svc.changeElement(
      {} as never,
      'p',
      'e',
      '#sel',
      'css',
      'val'
    );
    expect(result).toBe(false);
  });
});
