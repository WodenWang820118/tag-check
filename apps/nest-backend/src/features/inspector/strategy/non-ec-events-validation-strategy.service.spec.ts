import { describe, expect, it, vi } from 'vitest';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';
import { NonEcEventsValidationStrategy } from './non-ec-events-validation-strategy.service';

describe('NonEcEventsValidationStrategy', () => {
  function build() {
    const utils = new DataLayerValidationUtilsService();
    const strategy = new NonEcEventsValidationStrategy(utils);
    return { strategy, utils };
  }

  it('validates the matching event with the data layer utils helper', () => {
    const { strategy, utils } = build();
    const spy = vi.spyOn(utils, 'validateKeyValues');
    const spec = { event: 'page_view', page: '/home' } as never;
    const dataLayer = [
      { event: 'click' },
      { event: 'page_view', page: '/home' }
    ] as never;
    const result = strategy.validateDataLayer(dataLayer, spec);
    expect(spy).toHaveBeenCalledWith(spec, dataLayer[1]);
    expect(result.passed).toBe(true);
  });

  it('returns an "Event not found" result when no event in the data layer matches', () => {
    const { strategy } = build();
    const spec = { event: 'purchase' } as never;
    const dataLayer = [{ event: 'page_view' }] as never;
    const result = strategy.validateDataLayer(dataLayer, spec);
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Event not found: purchase');
  });
});
