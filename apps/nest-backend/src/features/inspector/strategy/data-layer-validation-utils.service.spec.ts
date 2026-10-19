import { describe, expect, it } from 'vitest';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

describe('DataLayerValidationUtilsService', () => {
  const service = new DataLayerValidationUtilsService();

  it('passes when all keys match exactly', () => {
    const spec = { event: 'page_view', page: '/home' } as never;
    const obj = { event: 'page_view', page: '/home' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(true);
    expect(result.message).toBe('Valid');
  });

  it('fails with a missing-key message when a spec key is absent on the event', () => {
    const spec = { event: 'page_view', page: '/home' } as never;
    const obj = { event: 'page_view' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('Key "page" is missing');
  });

  it('treats $-prefixed string spec values as a wildcard match', () => {
    const spec = { event: 'page_view', user_id: '$any' } as never;
    const obj = { event: 'page_view', user_id: 'whatever' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(true);
  });

  it('matches /pattern/ as a regex against string event values', () => {
    const spec = { event: 'page_view', page: '/^\\/home/' } as never;
    const okObj = { event: 'page_view', page: '/home/index' } as never;
    const badObj = { event: 'page_view', page: '/about' } as never;
    expect(service.validateKeyValues(spec, okObj).passed).toBe(true);
    const failed = service.validateKeyValues(spec, badObj);
    expect(failed.passed).toBe(false);
    expect(failed.message).toContain('does not match the regex pattern');
  });

  it('fails when a regex-spec value is compared against a non-string event value', () => {
    const spec = { event: 'page_view', count: '/^\\d+$/' } as never;
    const obj = { event: 'page_view', count: 5 } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('is not a string');
  });

  it('passes for matching numeric spec values and fails when they differ', () => {
    const spec = { event: 'purchase', value: 10 } as never;
    expect(
      service.validateKeyValues(spec, { event: 'purchase', value: 10 } as never)
        .passed
    ).toBe(true);
    expect(
      service.validateKeyValues(spec, { event: 'purchase', value: 11 } as never)
        .passed
    ).toBe(false);
  });

  it('fails when a literal string spec value does not match the event value', () => {
    const spec = { event: 'page_view', page: '/home' } as never;
    const obj = { event: 'page_view', page: '/about' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toContain(
      'Value for key "page" does not match the expected value'
    );
  });

  it('keeps validating the remaining keys after a $ wildcard', () => {
    const spec = { event: 'login', user_id: '$any', method: 'Google' } as never;
    const obj = { event: 'login', user_id: 'u1', method: 'Email' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toBe(
      'Value for key "method" does not match the expected value'
    );
  });

  it('only requires the key for a Tag Manager variable reference', () => {
    const spec = {
      event: 'add_to_cart',
      ecommerce: { value: '{{DLV - ecommerce.value}}' }
    } as never;
    expect(
      service.validateKeyValues(spec, {
        event: 'add_to_cart',
        ecommerce: { value: 30.03 }
      } as never).passed
    ).toBe(true);
    expect(
      service.validateKeyValues(spec, {
        event: 'add_to_cart',
        ecommerce: {}
      } as never).message
    ).toBe('Key "ecommerce.value" is missing in the data layer');
  });

  describe('nested ecommerce objects', () => {
    const spec = {
      event: 'add_to_cart',
      ecommerce: {
        currency: 'USD',
        value: 799,
        items: [
          { item_id: 'city001', price: 799, quantity: 1 },
          { item_id: 'city002', item_name: '/^Swi/' }
        ]
      }
    } as never;

    it('passes when every spec item matches an actual item in any order', () => {
      const obj = {
        event: 'add_to_cart',
        ecommerce: {
          currency: 'USD',
          value: 799,
          items: [
            { item_id: 'city002', item_name: 'Switzerland' },
            { item_id: 'city001', price: 799, quantity: 1, index: 0 }
          ]
        }
      } as never;
      expect(service.validateKeyValues(spec, obj).passed).toBe(true);
    });

    it('reports the path of a mismatching nested value', () => {
      const obj = {
        event: 'add_to_cart',
        ecommerce: {
          currency: 'TWD',
          value: 799,
          items: []
        }
      } as never;
      expect(service.validateKeyValues(spec, obj).message).toBe(
        'Value for key "ecommerce.currency" does not match the expected value'
      );
    });

    it('reports the path of an item that matches no actual item', () => {
      const obj = {
        event: 'add_to_cart',
        ecommerce: {
          currency: 'USD',
          value: 799,
          items: [{ item_id: 'city001', price: '799', quantity: 1 }]
        }
      } as never;
      expect(service.validateKeyValues(spec, obj).message).toBe(
        'Value for key "ecommerce.items[0].price" does not match the expected value'
      );
    });

    it('reports a missing item when the actual list is empty', () => {
      const obj = {
        event: 'add_to_cart',
        ecommerce: { currency: 'USD', value: 799, items: [] }
      } as never;
      expect(service.validateKeyValues(spec, obj).message).toBe(
        'Key "ecommerce.items[0]" is missing in the data layer'
      );
    });

    it('rejects values of the wrong shape', () => {
      expect(
        service.validateKeyValues(spec, {
          event: 'add_to_cart',
          ecommerce: 'none'
        } as never).message
      ).toBe('Value for key "ecommerce" is not an object as expected');
      expect(
        service.validateKeyValues(spec, {
          event: 'add_to_cart',
          ecommerce: { currency: 'USD', value: 799, items: 'none' }
        } as never).message
      ).toBe('Value for key "ecommerce.items" is not an array as expected');
    });
  });

  it('reports an invalid regex in the spec instead of throwing', () => {
    const spec = { event: 'page_view', page: '/[/' } as never;
    const obj = { event: 'page_view', page: '/home' } as never;
    expect(service.validateKeyValues(spec, obj).message).toBe(
      'Spec for key "page" is not a valid regex pattern'
    );
  });
});
