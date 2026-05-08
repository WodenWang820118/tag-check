import { describe, expect, it, vi } from 'vitest';
import { EvaluateChangeService } from './evaluate-change.service';

function build() {
  const actionUtilsService = { getElement: vi.fn() };
  return {
    service: new EvaluateChangeService(actionUtilsService as never),
    actionUtilsService
  };
}

describe('EvaluateChangeService', () => {
  it('returns false when no value is provided', async () => {
    const ctx = build();
    const result = await ctx.service.operate(
      {} as never,
      'p',
      'e',
      'sel',
      'css'
    );
    expect(result).toBe(false);
    expect(ctx.actionUtilsService.getElement).not.toHaveBeenCalled();
  });

  it('returns false when the element cannot be found', async () => {
    const ctx = build();
    ctx.actionUtilsService.getElement.mockResolvedValue(null);
    expect(
      await ctx.service.operate({} as never, 'p', 'e', 'sel', 'css', 'v')
    ).toBe(false);
  });

  it('calls .select() on a SELECT element', async () => {
    const ctx = build();
    const element = {
      evaluate: vi.fn().mockResolvedValue('select'),
      select: vi.fn().mockResolvedValue(undefined),
      type: vi.fn()
    };
    ctx.actionUtilsService.getElement.mockResolvedValue(element);
    expect(
      await ctx.service.operate({} as never, 'p', 'e', 'sel', 'css', 'v', 50)
    ).toBe(true);
    expect(element.select).toHaveBeenCalledWith('v');
  });

  it('calls .type() on an INPUT element', async () => {
    const ctx = build();
    const element = {
      evaluate: vi.fn().mockResolvedValue('input'),
      type: vi.fn().mockResolvedValue(undefined),
      select: vi.fn()
    };
    ctx.actionUtilsService.getElement.mockResolvedValue(element);
    expect(
      await ctx.service.operate({} as never, 'p', 'e', 'sel', 'css', 'v', 50)
    ).toBe(true);
    expect(element.type).toHaveBeenCalledWith('v');
  });

  it('returns false for unsupported element types', async () => {
    const ctx = build();
    const element = {
      evaluate: vi.fn().mockResolvedValue('div'),
      type: vi.fn(),
      select: vi.fn()
    };
    ctx.actionUtilsService.getElement.mockResolvedValue(element);
    expect(
      await ctx.service.operate({} as never, 'p', 'e', 'sel', 'css', 'v', 50)
    ).toBe(false);
  });
});
