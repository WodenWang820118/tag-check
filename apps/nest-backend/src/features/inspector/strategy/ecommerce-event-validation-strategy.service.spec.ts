import { describe, expect, it, vi } from 'vitest';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';
import { EcommerceEventValidationStrategy } from './ecommerce-event-validation-strategy.service';

describe('EcommerceEventValidationStrategy', () => {
  function build() {
    const utils = new DataLayerValidationUtilsService();
    const strategy = new EcommerceEventValidationStrategy(utils);
    return { strategy, utils };
  }

  it('returns "Event not found" when no matching event exists in the data layer', () => {
    const { strategy } = build();
    const result = strategy.validateDataLayer(
      [{ event: 'unrelated' }] as never,
      { event: 'purchase' } as never
    );
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Event not found: purchase');
  });

  it('fails the matching event when ecommerce was not reset to null beforehand', () => {
    const { strategy } = build();
    const result = strategy.validateDataLayer(
      [{ event: 'purchase', value: 1 }] as never,
      { event: 'purchase' } as never
    );
    expect(result.passed).toBe(false);
    expect(result.message).toContain('ecommerce must be reset');
  });

  it('delegates to validateKeyValues after seeing { ecommerce: null } prior to the matching event', () => {
    const { strategy, utils } = build();
    const spy = vi.spyOn(utils, 'validateKeyValues');
    const dataLayer = [
      { event: 'page_view' },
      { ecommerce: null },
      { event: 'purchase', value: 10 }
    ] as never;
    const spec = { event: 'purchase', value: 10 } as never;
    const result = strategy.validateDataLayer(dataLayer, spec);
    expect(spy).toHaveBeenCalledWith(spec, dataLayer[2]);
    expect(result.passed).toBe(true);
  });
});
