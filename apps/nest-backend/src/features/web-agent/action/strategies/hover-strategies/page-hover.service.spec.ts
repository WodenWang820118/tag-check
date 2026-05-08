import { describe, expect, it, vi } from 'vitest';
import { PageHoverService } from './page-hover.service';

describe('PageHoverService', () => {
  it('returns true when page.hover() resolves before the timeout', async () => {
    const service = new PageHoverService();
    const page = { hover: vi.fn().mockResolvedValue(undefined) };
    const result = await service.operate(
      page as never,
      'p',
      't',
      'sel',
      'css',
      50
    );
    expect(result).toBe(true);
    expect(page.hover).toHaveBeenCalledWith('sel');
  });

  it('returns false and logs when page.hover() rejects', async () => {
    const service = new PageHoverService();
    const page = { hover: vi.fn().mockRejectedValue(new Error('no element')) };
    const result = await service.operate(
      page as never,
      'p',
      't',
      'sel',
      'css',
      50
    );
    expect(result).toBe(false);
  });
});
