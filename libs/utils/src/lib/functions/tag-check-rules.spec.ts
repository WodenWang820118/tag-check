import { describe, expect, it } from 'vitest';
import {
  formatTagCheckNotes,
  readTagCheckRules,
  extractTagCheckRulesFromSpec,
  ruleToSpecValue,
  RULES_HEADER
} from './tag-check-rules';
import type { ParameterRule } from './measurement-plan';
import type { StrictDataLayerEvent } from '../types/tag-check';

describe('tag-check-rules', () => {
  describe('formatTagCheckNotes and readTagCheckRules round trip', () => {
    it('round-trips equals rules for strings, numbers, and booleans', () => {
      const eventRules: ParameterRule[] = [
        { kind: 'equals', name: 'currency', value: 'TWD' },
        { kind: 'equals', name: 'value', value: 100 },
        { kind: 'equals', name: 'in_stock', value: true }
      ];
      const itemRules: ParameterRule[] = [
        { kind: 'equals', name: 'quantity', value: 2 },
        { kind: 'equals', name: 'item_category', value: 'Apparel' }
      ];

      const notes = formatTagCheckNotes(eventRules, itemRules);
      expect(notes).toBeDefined();
      expect(notes).toContain(RULES_HEADER);
      expect(notes).toContain('currency = "TWD"');
      expect(notes).toContain('value = 100');
      expect(notes).toContain('in_stock = true');
      expect(notes).toContain('items.quantity = 2');
      expect(notes).toContain('items.item_category = "Apparel"');

      const parsed = readTagCheckRules(notes);
      expect(parsed.eventRules).toEqual(eventRules);
      expect(parsed.itemRules).toEqual(itemRules);
    });

    it('round-trips regex patterns with and without flags', () => {
      const eventRules: ParameterRule[] = [
        { kind: 'pattern', name: 'transaction_id', pattern: '^T\\d+$' },
        { kind: 'pattern', name: 'coupon', pattern: 'PROMO_.*', flags: 'i' }
      ];
      const itemRules: ParameterRule[] = [
        { kind: 'pattern', name: 'item_id', pattern: '^SKU-\\d{1,5}$' }
      ];

      const notes = formatTagCheckNotes(eventRules, itemRules);
      expect(notes).toBeDefined();
      expect(notes).toContain('transaction_id ~ /^T\\d+$/');
      expect(notes).toContain('coupon ~ /PROMO_.*/i');
      expect(notes).toContain('items.item_id ~ /^SKU-\\d{1,5}$/');

      const parsed = readTagCheckRules(notes);
      expect(parsed.eventRules).toEqual(eventRules);
      expect(parsed.itemRules).toEqual(itemRules);
    });

    it('omits any rules and returns undefined when no rules need recording', () => {
      const eventRules: ParameterRule[] = [
        { kind: 'any', name: 'method' },
        { kind: 'any', name: 'source' }
      ];
      const itemRules: ParameterRule[] = [{ kind: 'any', name: 'item_id' }];

      expect(formatTagCheckNotes(eventRules, itemRules)).toBeUndefined();
      expect(formatTagCheckNotes([])).toBeUndefined();
    });

    it('reads rules even when notes contain other text before and after', () => {
      const text = [
        'Created by QA team.',
        'DO NOT DELETE',
        '',
        RULES_HEADER,
        'currency = "USD"',
        'transaction_id ~ /^TRX-/',
        'items.item_id ~ /^ITEM-/',
        '',
        'Additional manual notes below:'
      ].join('\n');

      const parsed = readTagCheckRules(text);
      expect(parsed.eventRules).toEqual([
        { kind: 'equals', name: 'currency', value: 'USD' },
        { kind: 'pattern', name: 'transaction_id', pattern: '^TRX-' }
      ]);
      expect(parsed.itemRules).toEqual([
        { kind: 'pattern', name: 'item_id', pattern: '^ITEM-' }
      ]);
    });

    it('returns empty rules when notes is undefined, empty, or missing rules header', () => {
      expect(readTagCheckRules(undefined)).toEqual({
        eventRules: [],
        itemRules: []
      });
      expect(readTagCheckRules('')).toEqual({
        eventRules: [],
        itemRules: []
      });
      expect(readTagCheckRules('Just arbitrary tag description')).toEqual({
        eventRules: [],
        itemRules: []
      });
    });
  });

  describe('extractTagCheckRulesFromSpec', () => {
    it('extracts equals and pattern rules from ecommerce and items', () => {
      const spec: StrictDataLayerEvent = {
        event: 'purchase',
        ecommerce: {
          currency: 'TWD',
          value: 123.45,
          transaction_id: '/^T\\d+$/',
          coupon: '$coupon',
          items: [
            {
              item_id: '/^SKU-/',
              price: 50,
              item_name: '$item_name'
            }
          ]
        }
      };

      const { eventRules, itemRules } = extractTagCheckRulesFromSpec(spec);
      expect(eventRules).toEqual([
        { kind: 'equals', name: 'currency', value: 'TWD' },
        { kind: 'equals', name: 'value', value: 123.45 },
        { kind: 'pattern', name: 'transaction_id', pattern: '^T\\d+$' }
      ]);
      expect(itemRules).toEqual([
        { kind: 'pattern', name: 'item_id', pattern: '^SKU-' },
        { kind: 'equals', name: 'price', value: 50 }
      ]);
    });

    it('extracts top-level rules for non-ecommerce events', () => {
      const spec: StrictDataLayerEvent = {
        event: 'custom_search',
        search_term: '/^google/i',
        results_count: 10,
        page: '$page'
      };

      const { eventRules, itemRules } = extractTagCheckRulesFromSpec(spec);
      expect(eventRules).toEqual([
        {
          kind: 'pattern',
          name: 'search_term',
          pattern: '^google',
          flags: 'i'
        },
        { kind: 'equals', name: 'results_count', value: 10 }
      ]);
      expect(itemRules).toEqual([]);
    });

    it('ignores $name and {{variable}} placeholders', () => {
      const spec: StrictDataLayerEvent = {
        event: 'login',
        method: '$method',
        source: '{{DLV - source}}'
      };

      const { eventRules, itemRules } = extractTagCheckRulesFromSpec(spec);
      expect(eventRules).toEqual([]);
      expect(itemRules).toEqual([]);
    });
  });

  describe('ruleToSpecValue', () => {
    it('converts equals rules to literal values', () => {
      expect(
        ruleToSpecValue({ kind: 'equals', name: 'a', value: 'hello' })
      ).toBe('hello');
      expect(ruleToSpecValue({ kind: 'equals', name: 'b', value: 42 })).toBe(
        42
      );
      expect(ruleToSpecValue({ kind: 'equals', name: 'c', value: false })).toBe(
        false
      );
    });

    it('converts pattern rules to regex strings', () => {
      expect(
        ruleToSpecValue({ kind: 'pattern', name: 'a', pattern: '^T\\d+$' })
      ).toBe('/^T\\d+$/');
      expect(
        ruleToSpecValue({
          kind: 'pattern',
          name: 'b',
          pattern: 'abc',
          flags: 'i'
        })
      ).toBe('/abc/i');
    });

    it('converts any rules to $name placeholders', () => {
      expect(ruleToSpecValue({ kind: 'any', name: 'method' })).toBe('$method');
      expect(ruleToSpecValue({ kind: 'any', name: '$already_dollar' })).toBe(
        '$already_dollar'
      );
    });
  });
});
