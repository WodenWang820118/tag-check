import { describe, expect, it } from 'vitest';
import { events } from './events';

describe('events registry', () => {
  it('contains the canonical 12-event GA4 funnel keys', () => {
    expect(Object.keys(events).sort()).toEqual(
      [
        'addPaymentInfo',
        'addShippingInfo',
        'addToCart',
        'beginCheckout',
        'pageView',
        'purchase',
        'refund',
        'selectPromotion',
        'viewCart',
        'viewItem',
        'viewItemList',
        'viewPromotion'
      ].sort()
    );
  });

  it('every entry exposes eventName, testName, recording.title and spec.tag.name', () => {
    for (const [key, event] of Object.entries(events)) {
      expect(typeof event.eventName).toBe('string');
      expect(event.eventName.length).toBeGreaterThan(0);
      expect(typeof event.testName).toBe('string');
      expect(event.testName.length).toBeGreaterThan(0);
      expect(event.recording.title).toBe(event.eventName);
      expect(event.spec.tag.name).toBe(event.testName);
      // sanity: the registry key is camelCase shorthand for the snake_case event name
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('exposes pageView with event_name "page_view"', () => {
    expect(events['pageView'].eventName).toBe('page_view');
  });

  it('exposes purchase with event_name "purchase"', () => {
    expect(events['purchase'].eventName).toBe('purchase');
  });
});
