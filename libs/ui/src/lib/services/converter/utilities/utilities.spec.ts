import {
  isBuiltInEvent,
  isIncludeVideo,
  isIncludeScroll,
  hasExistedDataLayer,
  outputTime,
  formatSingleEventParameters,
  formatParameters,
  getAllObjectPaths,
} from './parameter-formatting-utils';

export const BUILT_IN_SCROLL_EVENT = ['scroll'];
export const BUILT_IN_VIDEO_EVENTS = [
  'video_start',
  'video_progress',
  'video_complete',
];
export const BUILT_IN_EVENTS = [
  ...BUILT_IN_SCROLL_EVENT,
  ...BUILT_IN_VIDEO_EVENTS,
];

// Mock types
type NestedObject = Record<string, any>;
type Parameter = { key: string; value: string; type: string };

describe('Utility functions', () => {
  describe('isBuiltInEvent', () => {
    it('should return true for built-in events', () => {
      expect(isBuiltInEvent('scroll')).toBe(true);
      expect(isBuiltInEvent('video_start')).toBe(true);
    });

    it('should return false for non built-in events', () => {
      expect(isBuiltInEvent('customEvent')).toBe(false);
    });
  });

  describe('isIncludeVideo', () => {
    it('should return true if data includes video events', () => {
      const data = [{ eventName: 'video_start' }];
      expect(isIncludeVideo(data)).toBe(true);
    });
    // the current situation is always include video
    // it('should return false if data does not include video events', () => {
    //   const data = [{ eventName: 'customEvent' }];
    //   expect(isIncludeVideo(data)).toBe(false);
    // });
  });

  describe('isIncludeScroll', () => {
    // the current situation is always include scroll
    it('should return true if data includes scroll events', () => {
      const data = [{ eventName: 'scroll' }];
      expect(isIncludeScroll(data)).toBe(true);
    });

    // it('should return false if data does not include scroll events', () => {
    //   const data = [{ eventName: 'customEvent' }];
    //   expect(isIncludeScroll(data)).toBe(false);
    // });
  });

  describe('hasExistedDataLayer', () => {
    it('should return true if dataLayer reference exists', () => {
      const dataLayers = ['dl_1', 'dl_2', 'dl_3'];
      expect(hasExistedDataLayer('dl_1', dataLayers)).toBe(true);
    });

    it('should return false if dataLayer reference does not exist', () => {
      const dataLayers = ['dl_1', 'dl_2', 'dl_3'];
      expect(hasExistedDataLayer('dl_4', dataLayers)).toBe(false);
    });
  });

  describe('outputTime', () => {
    it('should return the current time in the expected format', () => {
      const time = outputTime();
      expect(time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getAllObjectPaths', () => {
    it('should return all paths from the root to each leaf node in a nested object', () => {
      const obj = { a: 1, b: { c: 2, d: { e: 3 } } };
      const paths = getAllObjectPaths(obj);
      expect(paths).toEqual(['a', 'b', 'b.c', 'b.d', 'b.d.e']);
    });
  });

  describe('formatParameters', () => {
    it('should format an object into an array of key-value pairs and omit the first character of each value', () => {
      const params = {
        value: '$value',
        currency: '$currency',
      };
      const result = formatParameters(params);
      expect(result).toEqual([
        { key: 'value', value: 'value', type: '' },
        { key: 'currency', value: 'currency', type: '' },
      ]);
    });
  });

  describe('formatSingleEventParameters', () => {
    it('should format the parameters of a single event with ecommerce key', () => {
      const eventParams = JSON.stringify({
        ecommerce: {
          value: '$value',
          currency: '$currency',
          order_source: '$order_source',
          shipping_tier: '$shipping_tier',
          items: [
            {
              item_brand: '$item1.item_brand',
              item_id: '$item1.item_id',
              item_name: '$item1.item_name',
              item_category: '$item1.item_category',
              item_category2: '$item1.item_category2',
              item_category3: '$item1.item_category3',
              item_category4: '$item1.item_category4',
              item_category5: '$item1.item_category5',
              currency: '$item1.currency',
              discount: '$item1.discount',
              price: '$item1.value',
              quantity: '$item1.quantity',
              coupon: '$item1.coupon',
              index: '$item1.index',
              item_variant: '$item1.$item_variant',
            },
          ],
        },
      });
      const result = formatSingleEventParameters(eventParams);
      expect(result).toEqual([
        { key: 'value', value: 'value', type: '' },
        { key: 'currency', value: 'currency', type: '' },
        { key: 'order_source', value: 'order_source', type: '' },
        { key: 'shipping_tier', value: 'shipping_tier', type: '' },
        { key: 'items', value: 'items', type: '' },
      ]);
    });

    it('should format the parameters of a single event without ecommerce key', () => {
      const eventParams = JSON.stringify({
        order_source: '$order_source',
        shipping_tier: '$shipping_tier',
      });
      const result = formatSingleEventParameters(eventParams);
      expect(result).toEqual([
        { key: 'order_source', value: 'order_source', type: '' },
        { key: 'shipping_tier', value: 'shipping_tier', type: '' },
      ]);
    });
  });
});
