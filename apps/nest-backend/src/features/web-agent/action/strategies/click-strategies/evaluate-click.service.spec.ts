import { describe, expect, it, vi } from 'vitest';
import { EvaluateClickService } from './evaluate-click.service';

describe('EvaluateClickService', () => {
  it('clicks the resolved ElementHandle directly', async () => {
    const element = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn().mockResolvedValue(undefined)
    };
    const actionUtils = {
      getElement: vi.fn().mockResolvedValue(element)
    };
    const page = {
      evaluate: vi.fn()
    };
    const service = new EvaluateClickService(actionUtils as any);

    const result = await service.operate(
      page as any,
      'project',
      'event',
      '#buy',
      'id',
      100
    );

    expect(result).toBe(true);
    expect(actionUtils.getElement).toHaveBeenCalledWith(page, 'id', '#buy');
    expect(element.evaluate).toHaveBeenCalledTimes(1);
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
    const service = new EvaluateClickService(actionUtils as any);

    const result = await service.operate(
      page as any,
      'project',
      'event',
      '#missing',
      'id',
      100
    );

    expect(result).toBe(false);
    expect(page.evaluate).not.toHaveBeenCalled();
  });
});
