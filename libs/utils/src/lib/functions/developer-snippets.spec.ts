import { describe, expect, it } from 'vitest';
import type { StrictDataLayerEvent } from '../types/tag-check';
import {
  buildDeveloperSnippet,
  buildDeveloperSnippets,
  formatAllDeveloperSnippets,
  getGa4EventReferenceUrl,
  isEcommerceEvent
} from './developer-snippets';

/** Spec fixtures hold rule values (strings, booleans) the spec type omits. */
const asSpec = (value: object): StrictDataLayerEvent =>
  value as StrictDataLayerEvent;
const asSpecs = (value: object[]): StrictDataLayerEvent[] =>
  value as StrictDataLayerEvent[];

describe('developer-snippets', () => {
  describe('getGa4EventReferenceUrl', () => {
    it('returns the Google reference documentation URL with anchor for recommended ecommerce events', () => {
      expect(getGa4EventReferenceUrl('purchase')).toBe(
        'https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#purchase'
      );
      expect(getGa4EventReferenceUrl('add_to_cart')).toBe(
        'https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#add_to_cart'
      );
    });

    it('returns the Google reference documentation URL with anchor for recommended non-ecommerce events', () => {
      expect(getGa4EventReferenceUrl('login')).toBe(
        'https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#login'
      );
      expect(getGa4EventReferenceUrl('sign_up')).toBe(
        'https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#sign_up'
      );
      expect(getGa4EventReferenceUrl('search')).toBe(
        'https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#search'
      );
    });

    it('returns null for custom events', () => {
      expect(getGa4EventReferenceUrl('custom_button_click')).toBeNull();
      expect(getGa4EventReferenceUrl('hero_banner_interaction')).toBeNull();
    });
  });

  describe('isEcommerceEvent', () => {
    it('identifies standard GA4 ecommerce events', () => {
      expect(isEcommerceEvent({ event: 'purchase' })).toBe(true);
      expect(isEcommerceEvent({ event: 'view_item' })).toBe(true);
      expect(isEcommerceEvent({ event: 'begin_checkout' })).toBe(true);
    });

    it('identifies custom events with an ecommerce object', () => {
      expect(
        isEcommerceEvent({
          event: 'custom_order',
          ecommerce: { transaction_id: '123' }
        })
      ).toBe(true);
    });

    it('returns false for non-ecommerce events', () => {
      expect(isEcommerceEvent({ event: 'login' })).toBe(false);
      expect(isEcommerceEvent({ event: 'sign_up' })).toBe(false);
      expect(isEcommerceEvent({ event: 'custom_event' })).toBe(false);
    });
  });

  describe('buildDeveloperSnippet - rule comments and values', () => {
    it('gives item rules an example value and a comment, not the pattern as the value', () => {
      const snippet = buildDeveloperSnippet(
        asSpec({
          event: 'purchase',
          ecommerce: {
            items: [
              { item_id: '/^SKU-/', item_name: '$item_name', quantity: 1 }
            ]
          }
        })
      );

      expect(snippet).toContain("item_id: 'SKU_123'");
      expect(snippet).not.toContain("item_id: '/^SKU-/'");
      expect(snippet).toContain('item_id must match /^SKU-/');
      expect(snippet).toContain('quantity must be 1');
    });

    it('formats a purchase ecommerce event with regex, literal, and any value rules matching the canonical sample', () => {
      const spec = asSpec({
        event: 'purchase',
        ecommerce: {
          transaction_id: '/^T\\d+$/',
          currency: 'TWD',
          value: '$value',
          items: [
            {
              item_id: '$item_id',
              item_name: '$item_name',
              price: '$price'
            }
          ]
        }
      });

      const snippet = buildDeveloperSnippet(spec);

      // Verify header comment with anchor
      expect(snippet).toContain(
        '// purchase: https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#purchase'
      );
      // Verify dataLayer initialization
      expect(snippet).toContain('window.dataLayer = window.dataLayer || [];');
      // Verify ecommerce clearing line
      expect(snippet).toContain(
        'window.dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object'
      );
      // Verify event push structure
      expect(snippet).toContain("event: 'purchase'");
      // Verify regex rule comment and placeholder
      expect(snippet).toMatch(
        /transaction_id: 'T12345',\s*\/\/\s*must match \/\^T\\d\+\$\//
      );
      // Verify literal value rule comment and value
      expect(snippet).toMatch(/currency: 'TWD',\s*\/\/\s*must be "TWD"/);
      // Verify any value rule comment and placeholder
      expect(snippet).toMatch(/value: 0,\s*\/\/\s*any value/);
      // Verify items formatting
      expect(snippet).toContain(
        "items: [{ item_id: 'SKU_123', item_name: 'Example', price: 0 }]"
      );
    });

    it('formats non-ecommerce recommended events without ecommerce clearing', () => {
      const spec = asSpec({
        event: 'sign_up',
        method: 'email'
      });

      const snippet = buildDeveloperSnippet(spec);

      expect(snippet).toContain(
        '// sign_up: https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#sign_up'
      );
      expect(snippet).toContain('window.dataLayer = window.dataLayer || [];');
      expect(snippet).not.toContain('ecommerce: null');
      expect(snippet).not.toContain('ecommerce: {');
      expect(snippet).toMatch(/method: 'email'\s*\/\/\s*must be "email"/);
    });

    it('formats custom events with custom header comment and any value placeholder', () => {
      const spec = asSpec({
        event: 'custom_conversion',
        tier: '$tier',
        code: '/^[A-Z]{3}$/'
      });

      const snippet = buildDeveloperSnippet(spec);

      expect(snippet.startsWith('// custom_conversion\n')).toBe(true);
      expect(snippet).not.toContain('https://');
      expect(snippet).not.toContain('ecommerce: null');
      expect(snippet).toMatch(/tier: 'example',\s*\/\/\s*any value/);
      expect(snippet).toMatch(
        /code: 'example'\s*\/\/\s*must match \/\^\[A-Z\]\{3\}\$\//
      );
    });

    it('supports numeric and boolean literal rules', () => {
      const spec = asSpec({
        event: 'level_up',
        level: 10,
        character_unlocked: true
      });

      const snippet = buildDeveloperSnippet(spec);

      expect(snippet).toMatch(/level: 10,\s*\/\/\s*must be 10/);
      expect(snippet).toMatch(/character_unlocked: true\s*\/\/\s*must be true/);
    });

    it('handles empty parameters and empty items array', () => {
      const plainEcommerce = asSpec({
        event: 'view_item_list',
        ecommerce: {
          items: []
        }
      });

      const snippet = buildDeveloperSnippet(plainEcommerce);

      expect(snippet).toContain(
        'window.dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object'
      );
      expect(snippet).toContain('items: []');

      const plainEvent = asSpec({
        event: 'custom_ping'
      });
      const pingSnippet = buildDeveloperSnippet(plainEvent);
      expect(pingSnippet).toContain("event: 'custom_ping'");
      expect(pingSnippet).not.toContain('// any value');
    });
  });

  describe('buildDeveloperSnippets and formatAllDeveloperSnippets', () => {
    it('generates snippets for all input specs', () => {
      const specs = asSpecs([
        { event: 'login', method: '$method' },
        { event: 'view_item', ecommerce: { currency: 'USD', value: '$value' } }
      ]);

      const snippets = buildDeveloperSnippets(specs);

      expect(snippets).toHaveLength(2);
      expect(snippets[0].eventName).toBe('login');
      expect(snippets[1].eventName).toBe('view_item');

      const combined = formatAllDeveloperSnippets(snippets);
      expect(combined).toContain('// login:');
      expect(combined).toContain('// view_item:');
      expect(combined.split('\n\n')).toHaveLength(2);
    });

    it('returns empty string when formatAllDeveloperSnippets receives an empty array', () => {
      expect(formatAllDeveloperSnippets([])).toBe('');
    });
  });
});
