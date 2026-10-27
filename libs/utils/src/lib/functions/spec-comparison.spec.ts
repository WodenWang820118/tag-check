import { describe, expect, it } from 'vitest';
import { compareWithSpec } from './spec-comparison';

// The example project's add_to_cart spec and a recorded push.
const SPEC = {
  event: 'add_to_cart',
  ecommerce: {
    value: '{{DLV - ecommerce.value}}',
    currency: '{{DLV - ecommerce.currency}}'
  }
};
const PUSH = {
  event: 'add_to_cart',
  ecommerce: {
    value: 799,
    currency: 'USD',
    items: [{ item_id: 'city001', item_name: 'Switzerland', price: 799 }]
  }
};

describe('compareWithSpec', () => {
  it('has a row per spec key, and lists what the spec does not ask for', () => {
    expect(compareWithSpec(SPEC, PUSH)).toEqual({
      rows: [
        {
          path: 'event',
          expected: 'add_to_cart',
          actual: 'add_to_cart',
          requirement: 'equal',
          passed: true
        },
        {
          path: 'ecommerce.value',
          expected: '{{DLV - ecommerce.value}}',
          actual: 799,
          requirement: 'present',
          passed: true
        },
        {
          path: 'ecommerce.currency',
          expected: '{{DLV - ecommerce.currency}}',
          actual: 'USD',
          requirement: 'present',
          passed: true
        }
      ],
      extras: [{ path: 'ecommerce.items', actual: PUSH.ecommerce.items }]
    });
  });

  it('fails a missing key, a different value and a pattern that does not match', () => {
    const { rows } = compareWithSpec(
      {
        event: 'purchase',
        value: 10,
        transaction_id: '/^T-\\d+$/',
        coupon: '$coupon'
      },
      { event: 'purchase', value: 12, transaction_id: 'order-7' }
    );

    expect(
      rows.map(({ path, passed, reason }) => [path, passed, reason])
    ).toEqual([
      ['event', true, undefined],
      ['value', false, 'different'],
      ['transaction_id', false, 'does not match the pattern'],
      ['coupon', false, 'missing']
    ]);
  });

  it('matches each spec entry with any pushed entry, and keeps the others as extras', () => {
    const { rows, extras } = compareWithSpec(
      { items: [{ item_id: 'B', price: '$price' }] },
      {
        items: [
          { item_id: 'A', price: 1 },
          { item_id: 'B', price: 2, quantity: 1 }
        ]
      }
    );

    expect(rows).toEqual([
      {
        path: 'items[1].item_id',
        expected: 'B',
        actual: 'B',
        requirement: 'equal',
        passed: true
      },
      {
        path: 'items[1].price',
        expected: '$price',
        actual: 2,
        requirement: 'present',
        passed: true
      }
    ]);
    expect(extras).toEqual([
      { path: 'items[0]', actual: { item_id: 'A', price: 1 } },
      { path: 'items[1].quantity', actual: 1 }
    ]);
  });

  it("shows the entry at the spec entry's position when none matches", () => {
    const { rows } = compareWithSpec(
      { items: [{ item_id: 'C' }] },
      { items: [{ item_id: 'A' }] }
    );

    expect(rows).toEqual([
      {
        path: 'items[0].item_id',
        expected: 'C',
        actual: 'A',
        requirement: 'equal',
        passed: false,
        reason: 'different'
      }
    ]);
  });

  it('fails wrong shapes and an invalid pattern', () => {
    const { rows } = compareWithSpec(
      { ecommerce: { items: [{}] }, user: { id: '$id' }, name: '/(/' },
      { ecommerce: { items: 'none' }, user: 'u1', name: 'x' }
    );

    expect(rows.map(({ path, reason }) => [path, reason])).toEqual([
      ['ecommerce.items', 'not an array'],
      ['user', 'not an object'],
      ['name', 'the pattern is not valid']
    ]);
  });

  it('marks every spec key missing without a push', () => {
    const { rows, extras } = compareWithSpec(SPEC, undefined);

    expect(rows.map(({ path, passed }) => [path, passed])).toEqual([
      ['event', false],
      ['ecommerce', false]
    ]);
    expect(extras).toEqual([]);
  });
});
