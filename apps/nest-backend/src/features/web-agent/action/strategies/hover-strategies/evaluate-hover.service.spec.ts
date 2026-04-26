import { describe, expect, it, vi } from 'vitest';
import { EvaluateHoverService } from './evaluate-hover.service';

describe('EvaluateHoverService', () => {
  it('hovers the resolved ElementHandle instead of focusing it', async () => {
    const element = {
      hover: vi.fn().mockResolvedValue(undefined),
      focus: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn().mockResolvedValue(undefined)
    };
    const actionUtils = {
      getElement: vi.fn().mockResolvedValue(element)
    };
    const page = {
      evaluate: vi.fn()
    };
    const service = new EvaluateHoverService(actionUtils as any);

    const result = await service.operate(
      page as any,
      'project',
      'event',
      '.menu',
      'css',
      100
    );

    expect(result).toBe(true);
    expect(actionUtils.getElement).toHaveBeenCalledWith(page, 'css', '.menu');
    expect(element.hover).toHaveBeenCalledTimes(1);
    expect(element.focus).not.toHaveBeenCalled();
    expect(element.dispose).toHaveBeenCalledTimes(1);
    expect(page.evaluate).not.toHaveBeenCalled();
  });

  it('returns false when no element is resolved', async () => {
    const actionUtils = {
      getElement: vi.fn().mockResolvedValue(null)
    };
    const page = {
      evaluate: vi.fn()
    };
    const service = new EvaluateHoverService(actionUtils as any);

    const result = await service.operate(
      page as any,
      'project',
      'event',
      '.missing',
      'css',
      100
    );

    expect(result).toBe(false);
    expect(page.evaluate).not.toHaveBeenCalled();
  });
});
