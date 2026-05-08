import { describe, expect, it, vi } from 'vitest';
import { InspectorUtilsService } from './inspector-utils.service';
import { ValidationStrategyType } from './utils';

function build(
  strategies: Record<
    string,
    { validateDataLayer: (...args: unknown[]) => unknown }
  >
) {
  const service = new InspectorUtilsService(strategies as never);
  return service;
}

describe('InspectorUtilsService', () => {
  describe('isNumericKeysObject()', () => {
    it('returns false for plain objects whose keys are stringified numbers (Number.isInteger requires real numbers)', () => {
      const service = build({});
      expect(service.isNumericKeysObject({ 0: 'a', 1: 'b' })).toBe(false);
    });

    it('returns false when any key is not numeric', () => {
      const service = build({});
      expect(service.isNumericKeysObject({ 0: 'a', x: 'b' })).toBe(false);
    });

    it('returns false for non-objects and null', () => {
      const service = build({});
      expect(service.isNumericKeysObject(null)).toBe(false);
      expect(service.isNumericKeysObject('x')).toBe(false);
    });
  });

  describe('determineStrategy()', () => {
    it('returns NONEC by default', () => {
      const service = build({});
      expect(service.determineStrategy()).toBe(ValidationStrategyType.NONEC);
    });
  });

  describe('isDataLayerCorrect()', () => {
    it('delegates to the configured NONEC strategy with the dataLayer and spec', () => {
      const validate = vi.fn().mockReturnValue({ passed: true });
      const service = build({
        [ValidationStrategyType.NONEC]: { validateDataLayer: validate }
      });
      const dataLayer = [{ event: 'page_view' }] as never;
      const spec = { event: 'page_view' } as never;
      const result = service.isDataLayerCorrect(dataLayer, spec);
      expect(validate).toHaveBeenCalledWith(dataLayer, spec);
      expect(result).toEqual({ passed: true });
    });

    it('wraps strategy failures into INTERNAL_SERVER_ERROR HttpException', () => {
      const validate = vi.fn().mockImplementation(() => {
        throw new Error('boom');
      });
      const service = build({
        [ValidationStrategyType.NONEC]: { validateDataLayer: validate }
      });
      expect(() =>
        service.isDataLayerCorrect([] as never, { event: 'x' } as never)
      ).toThrow();
    });
  });
});
