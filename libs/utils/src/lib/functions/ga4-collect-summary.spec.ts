import { describe, expect, it } from 'vitest';
import { summarizeGa4Collect } from './ga4-collect-summary';

// Recorded from gtag.js on ng-gtm-sample (add_to_cart, GTM preview), trimmed.
const ADD_TO_CART =
  'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK&_dbg=1&cid=899416042.1792892190&cu=USD&dl=https%3A%2F%2Fng-gtm-sample.vercel.app%2Fproduct%2Fdetails%2Fswitzerland&dt=Switzerland%20%7C%20Travel%20With%20GTM&en=add_to_cart&pr1=idcity001~nmSwitzerland~lndestinations~caSwitzerland~qt1~pr799&epn.value=799&ep.promotion_id=city001&ep.creative_slot=featured_attributor';

describe('summarizeGa4Collect', () => {
  it('reads the event, its parameters, items and page', () => {
    expect(summarizeGa4Collect(ADD_TO_CART)).toEqual({
      eventName: 'add_to_cart',
      measurementId: 'G-8HKQR5ZBSK',
      parameters: [
        { name: 'currency', value: 'USD', numeric: false },
        { name: 'value', value: '799', numeric: true },
        { name: 'promotion_id', value: 'city001', numeric: false },
        { name: 'creative_slot', value: 'featured_attributor', numeric: false }
      ],
      items: [
        {
          item_id: 'city001',
          item_name: 'Switzerland',
          item_list_name: 'destinations',
          item_category: 'Switzerland',
          quantity: '1',
          price: '799'
        }
      ],
      page: [
        {
          name: 'page_location',
          value: 'https://ng-gtm-sample.vercel.app/product/details/switzerland'
        },
        { name: 'page_title', value: 'Switzerland | Travel With GTM' }
      ],
      debug: true,
      other: [
        { key: 'v', value: '2' },
        { key: 'cid', value: '899416042.1792892190' }
      ]
    });
  });

  it('orders items by number and reads custom and escaped fields', () => {
    const summary = summarizeGa4Collect(
      '/g/collect?en=purchase&pr2=idB~nmBlue~~Red&pr1=idA~k0color~v0red'
    );

    expect(summary?.items).toEqual([
      { item_id: 'A', color: 'red' },
      { item_id: 'B', item_name: 'Blue~Red' }
    ]);
    expect(summary?.debug).toBe(false);
    expect(summary?.measurementId).toBeNull();
  });

  it('has nothing to read without a query', () => {
    expect(summarizeGa4Collect('')).toBeNull();
    expect(
      summarizeGa4Collect('https://www.google-analytics.com/g/collect')
    ).toBeNull();
  });
});
