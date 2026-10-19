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
  describe('determineStrategy()', () => {
    it.each(['add_to_cart', 'purchase', 'view_item_list', 'view_promotion'])(
      'uses ecommerce rules for the recommended ecommerce event %s',
      (event) => {
        const service = build({});
        expect(service.determineStrategy({ event } as never)).toBe(
          ValidationStrategyType.ECOMMERCE
        );
      }
    );

    it('uses ecommerce rules for a custom event whose spec carries items', () => {
      const service = build({});
      expect(
        service.determineStrategy({
          event: 'quick_buy',
          ecommerce: { items: [] }
        } as never)
      ).toBe(ValidationStrategyType.ECOMMERCE);
    });

    it('uses the non-ecommerce rules for other events', () => {
      const service = build({});
      expect(service.determineStrategy({ event: 'page_view' } as never)).toBe(
        ValidationStrategyType.NONEC
      );
      expect(
        service.determineStrategy({
          event: 'login',
          ecommerce: { method: 'Google' }
        } as never)
      ).toBe(ValidationStrategyType.NONEC);
    });
  });

  describe('isDataLayerCorrect()', () => {
    it('delegates to the strategy that matches the spec', () => {
      const nonEc = vi.fn().mockReturnValue({ passed: true });
      const ecommerce = vi.fn().mockReturnValue({ passed: false });
      const service = build({
        [ValidationStrategyType.NONEC]: { validateDataLayer: nonEc },
        [ValidationStrategyType.ECOMMERCE]: { validateDataLayer: ecommerce }
      });
      const dataLayer = [{ event: 'purchase' }] as never;
      const spec = { event: 'purchase' } as never;

      expect(service.isDataLayerCorrect(dataLayer, spec)).toEqual({
        passed: false
      });
      expect(ecommerce).toHaveBeenCalledWith(dataLayer, spec);
      expect(nonEc).not.toHaveBeenCalled();
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

  describe('isRequestCorrect()', () => {
    it('validates ecommerce requests without the data layer reset rule', () => {
      const nonEc = vi.fn().mockReturnValue({ passed: true });
      const ecommerce = vi.fn();
      const service = build({
        [ValidationStrategyType.NONEC]: { validateDataLayer: nonEc },
        [ValidationStrategyType.ECOMMERCE]: { validateDataLayer: ecommerce }
      });
      const request = { event: 'purchase', ecommerce: {} } as never;
      const spec = { event: 'purchase' } as never;

      expect(service.isRequestCorrect(request, spec)).toEqual({ passed: true });
      expect(nonEc).toHaveBeenCalledWith([request], spec);
      expect(ecommerce).not.toHaveBeenCalled();
    });
  });
});
