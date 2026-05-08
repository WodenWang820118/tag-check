import { EC_PARAMS } from './ec-params.service';

describe('EC_PARAMS', () => {
  it('contains the GA4 ecommerce essentials', () => {
    for (const k of [
      'value',
      'currency',
      'transaction_id',
      'items',
      'page_title'
    ]) {
      expect(EC_PARAMS).toContain(k);
    }
  });

  it('has no duplicate entries', () => {
    expect(new Set(EC_PARAMS).size).toBe(EC_PARAMS.length);
  });
});
