import { describe, expect, it } from 'vitest';
import { extractDataLayerPushes, fixJsonString } from './data-layer-push';

describe('extractDataLayerPushes', () => {
  it('handles nested parentheses inside strings without breaking argument extraction', () => {
    const text =
      "window.dataLayer.push({ event: 'test (with parenthesis)', detail: 'info (nested)' });";
    const result = extractDataLayerPushes(text);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([
      {
        event: 'test (with parenthesis)',
        detail: 'info (nested)'
      }
    ]);
  });

  it('repairs single-quoted keys and string values', () => {
    const text =
      "dataLayer.push({ 'event': 'view_item', 'ecommerce': { 'currency': 'USD' } });";
    const result = extractDataLayerPushes(text);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([
      {
        event: 'view_item',
        ecommerce: {
          currency: 'USD'
        }
      }
    ]);
  });

  it('repairs unquoted keys in nested object structures', () => {
    const text = `
      window.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          items: [
            {
              item_id: 'SKU_123',
              item_name: 'T-Shirt'
            }
          ]
        }
      });
    `;
    const result = extractDataLayerPushes(text);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([
      {
        event: 'view_item',
        ecommerce: {
          items: [
            {
              item_id: 'SKU_123',
              item_name: 'T-Shirt'
            }
          ]
        }
      }
    ]);
  });

  it('extracts several pushes in one cell, including ecommerce resets and subsequent events', () => {
    const cell = `
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          items: [{ item_id: 'SKU_A' }]
        }
      });
      dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
          currency: 'USD',
          value: '19.99'
        }
      });
    `;
    const result = extractDataLayerPushes(cell);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([
      {
        event: 'view_item',
        ecommerce: {
          items: [{ item_id: 'SKU_A' }]
        }
      },
      {
        event: 'add_to_cart',
        ecommerce: {
          currency: 'USD',
          value: '19.99'
        }
      }
    ]);
  });

  it('silently skips pushes without an event such as ecommerce: null resets', () => {
    const text = 'window.dataLayer.push({ ecommerce: null });';
    const result = extractDataLayerPushes(text);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([]);
  });

  it('records issues on parse failures from broken push arguments', () => {
    const text = "dataLayer.push({ event: 'purchase' value: 1 });";
    const result = extractDataLayerPushes(text);

    expect(result.specs).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain(
      'Failed to parse dataLayer.push argument'
    );
  });

  it('records an issue when dataLayer.push call is unclosed', () => {
    const text = "dataLayer.push({ event: 'unclosed'";
    const result = extractDataLayerPushes(text);

    expect(result.specs).toEqual([]);
    expect(result.issues).toEqual(['Unclosed dataLayer.push(...) call.']);
  });

  it('ignores dataLayer.push inside comments and string literals', () => {
    const text = `
      // window.dataLayer.push({ event: 'in_line_comment' });
      /* window.dataLayer.push({ event: 'in_block_comment' }); */
      const sample = "window.dataLayer.push({ event: 'in_string' })";
      window.dataLayer.push({ event: 'actual_event' });
    `;
    const result = extractDataLayerPushes(text);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([{ event: 'actual_event' }]);
  });

  it('supports pushes with array of event objects', () => {
    const text = "dataLayer.push([{ event: 'first' }, { event: 'second' }]);";
    const result = extractDataLayerPushes(text);

    expect(result.issues).toEqual([]);
    expect(result.specs).toEqual([{ event: 'first' }, { event: 'second' }]);
  });
});

describe('fixJsonString', () => {
  it('repairs comments, single quotes, unquoted keys, and trailing commas', () => {
    const input = `
      /* block comment */
      {
        event: 'purchase', // comment after value
        ecommerce: {
          currency: 'EUR',
          items: [
            { item_name: 'Book', },
          ],
        },
      }
    `;
    const fixed = fixJsonString(input);
    const parsed = JSON.parse(fixed);

    expect(parsed).toEqual({
      event: 'purchase',
      ecommerce: {
        currency: 'EUR',
        items: [{ item_name: 'Book' }]
      }
    });
  });
});
