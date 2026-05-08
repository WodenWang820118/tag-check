import { describe, expect, it, vi } from 'vitest';
import { PageClickService } from './page-click.service';

describe('PageClickService', () => {
  it('returns true when page.click() resolves before the timeout', async () => {
    const service = new PageClickService();
    const page = { click: vi.fn().mockResolvedValue(undefined) };
    const result = await service.operate(
      page as never,
      'p',
      'evt',
      'sel',
      'css',
      50
    );
    expect(result).toBe(true);
    expect(page.click).toHaveBeenCalledWith('sel', { delay: 100 });
  });

  it('returns false when page.click() rejects', async () => {
    const service = new PageClickService();
    const page = { click: vi.fn().mockRejectedValue(new Error('boom')) };
    const result = await service.operate(
      page as never,
      'p',
      'evt',
      'sel',
      'css',
      50
    );
    expect(result).toBe(false);
  });
});
