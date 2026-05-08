import { describe, expect, it, vi } from 'vitest';
import { PageChangeService } from './page-change.service';

describe('PageChangeService', () => {
  it('returns false when no value is provided', async () => {
    const result = await new PageChangeService().operate(
      { evaluate: vi.fn() } as never,
      'p',
      'e',
      'sel',
      'css'
    );
    expect(result).toBe(false);
  });

  it('uses page.select() when the target element is a select', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(true),
      select: vi.fn().mockResolvedValue(undefined),
      type: vi.fn()
    };
    expect(
      await new PageChangeService().operate(
        page as never,
        'p',
        'e',
        'sel',
        'css',
        'v',
        50
      )
    ).toBe(true);
    expect(page.select).toHaveBeenCalledWith('sel', 'v');
    expect(page.type).not.toHaveBeenCalled();
  });

  it('uses page.type() when the target element is not a select', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(false),
      select: vi.fn(),
      type: vi.fn().mockResolvedValue(undefined)
    };
    expect(
      await new PageChangeService().operate(
        page as never,
        'p',
        'e',
        'sel',
        'css',
        'v',
        50
      )
    ).toBe(true);
    expect(page.type).toHaveBeenCalledWith('sel', 'v');
  });

  it('returns false when the underlying page action rejects', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(false),
      type: vi.fn().mockRejectedValue(new Error('boom'))
    };
    expect(
      await new PageChangeService().operate(
        page as never,
        'p',
        'e',
        'sel',
        'css',
        'v',
        50
      )
    ).toBe(false);
  });
});
