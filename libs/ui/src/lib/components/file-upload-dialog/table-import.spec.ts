import { describe, expect, it } from 'vitest';
import { parseLegacySpecsTable, parsePlanTable } from './table-import';

describe('table-import', () => {
  describe('parsePlanTable', () => {
    it('returns unrecognized for an empty table', () => {
      expect(parsePlanTable([])).toEqual({ kind: 'unrecognized' });
    });

    it('returns unrecognized when measurement plan headers are missing', () => {
      const table: string[][] = [
        ['col_a', 'col_b'],
        ['val_a', 'val_b']
      ];
      expect(parsePlanTable(table)).toEqual({ kind: 'unrecognized' });
    });

    it('returns unrecognized when some required plan headers are missing', () => {
      const table: string[][] = [
        ['event_name', 'event_parameters'],
        ['login', 'method']
      ];
      expect(parsePlanTable(table)).toEqual({ kind: 'unrecognized' });
    });

    it('parses plan table with reordered headers successfully', () => {
      const table: string[][] = [
        ['item_parameters', 'event_name', 'event_parameters'],
        ['', 'login', 'method']
      ];
      expect(parsePlanTable(table)).toEqual({
        kind: 'ready',
        specs: [
          {
            event: 'login',
            method: '$method'
          }
        ]
      });
    });

    it('skips blank rows when parsing a plan table', () => {
      const table: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['', '', ''],
        ['login', 'method', ''],
        ['  ', '  ', '  '],
        []
      ];
      expect(parsePlanTable(table)).toEqual({
        kind: 'ready',
        specs: [
          {
            event: 'login',
            method: '$method'
          }
        ]
      });
    });

    it('returns invalid with exact message when recognized table contains no event rows', () => {
      const table: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters']
      ];
      expect(parsePlanTable(table)).toEqual({
        kind: 'invalid',
        message: 'The uploaded measurement plan contains no event rows.'
      });
    });

    it('returns invalid with exact message when recognized table contains only blank rows', () => {
      const table: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['', '', ''],
        ['  ', '  ', '  ']
      ];
      expect(parsePlanTable(table)).toEqual({
        kind: 'invalid',
        message: 'The uploaded measurement plan contains no event rows.'
      });
    });

    it('returns invalid with diagnostics when rows contain invalid event names or parameters', () => {
      const table: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['1invalid_event', 'method', ''],
        ['purchase', 'currency, bad-param', 'item_id']
      ];
      const result = parsePlanTable(table);
      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('1invalid_event');
        expect(result.message).toContain('bad-param');
      }
    });

    it('recognizes plan and returns invalid even if legacy header is also present', () => {
      const table: string[][] = [
        [
          'event_name',
          'event_parameters',
          'item_parameters',
          'dataLayer Specs'
        ],
        [
          '1invalid_event',
          'method',
          '',
          "window.dataLayer.push({ event: 'valid_event' });"
        ]
      ];
      const result = parsePlanTable(table);
      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('1invalid_event');
      }
    });

    it('parses multiple valid events including ecommerce items', () => {
      const table: string[][] = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', 'method', ''],
        ['purchase', 'currency=USD, value=49.99', 'item_id, price']
      ];
      expect(parsePlanTable(table)).toEqual({
        kind: 'ready',
        specs: [
          {
            event: 'login',
            method: '$method'
          },
          {
            event: 'purchase',
            ecommerce: {
              currency: 'USD',
              value: 49.99,
              items: [
                {
                  item_id: '$item_id',
                  price: '$price'
                }
              ]
            }
          }
        ]
      });
    });
  });

  describe('parseLegacySpecsTable', () => {
    it('returns unrecognized for an empty table', () => {
      expect(parseLegacySpecsTable([])).toEqual({ kind: 'unrecognized' });
    });

    it('returns unrecognized when dataLayer Specs header is absent', () => {
      const table: string[][] = [
        ['ID', 'Description'],
        ['1', 'sample']
      ];
      expect(parseLegacySpecsTable(table)).toEqual({ kind: 'unrecognized' });
    });

    it('parses table when dataLayer Specs header is at a different column index', () => {
      const table: string[][] = [
        ['Notes', 'dataLayer Specs', 'Author'],
        ['note 1', "window.dataLayer.push({ event: 'sign_up' });", 'Jane']
      ];
      expect(parseLegacySpecsTable(table)).toEqual({
        kind: 'ready',
        specs: [
          {
            event: 'sign_up'
          }
        ]
      });
    });

    it('skips blank rows when parsing legacy sheet', () => {
      const table: string[][] = [
        ['dataLayer Specs'],
        [''],
        ['   '],
        [],
        ["dataLayer.push({ event: 'page_view' });"],
        ['']
      ];
      expect(parseLegacySpecsTable(table)).toEqual({
        kind: 'ready',
        specs: [
          {
            event: 'page_view'
          }
        ]
      });
    });

    it('returns invalid with exact message for reset-only pushes', () => {
      const table: string[][] = [
        ['dataLayer Specs'],
        ['window.dataLayer.push({ ecommerce: null });']
      ];
      expect(parseLegacySpecsTable(table)).toEqual({
        kind: 'invalid',
        message:
          'The uploaded sheet contained no dataLayer.push call with an event.'
      });
    });

    it('parses multiple valid pushes across rows and within a cell, skipping resets', () => {
      const table: string[][] = [
        ['ID', 'dataLayer Specs', 'Comments'],
        [
          '1',
          'window.dataLayer.push({ ecommerce: null });\n' +
            "window.dataLayer.push({ event: 'view_item', " +
            "ecommerce: { items: [{ item_name: 'Hat' }] } });",
          'tested'
        ],
        [
          '2',
          "dataLayer.push({ event: 'purchase', " +
            "ecommerce: { currency: 'USD', value: 49.99 } });",
          'verified'
        ]
      ];
      expect(parseLegacySpecsTable(table)).toEqual({
        kind: 'ready',
        specs: [
          {
            event: 'view_item',
            ecommerce: { items: [{ item_name: 'Hat' }] }
          },
          {
            event: 'purchase',
            ecommerce: { currency: 'USD', value: 49.99 }
          }
        ]
      });
    });

    it('returns invalid with exact row numbers for malformed cells', () => {
      const table: string[][] = [
        ['dataLayer Specs'],
        ["window.dataLayer.push({ event: 'valid_event' });"],
        ['window.dataLayer.push({ event: broken payload {{{%% });']
      ];
      const result = parseLegacySpecsTable(table);
      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('Row 3:');
      }
    });

    it('retains exact row numbers when blank rows precede a malformed row', () => {
      const table: string[][] = [
        ['dataLayer Specs'],
        [''],
        ["window.dataLayer.push({ event: 'first_valid' });"],
        ['   '],
        ['window.dataLayer.push({ event: invalid json {{ });']
      ];
      const result = parseLegacySpecsTable(table);
      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('Row 5:');
      }
    });

    it('returns invalid with exact message when recognized table has header only', () => {
      const table: string[][] = [['dataLayer Specs']];
      expect(parseLegacySpecsTable(table)).toEqual({
        kind: 'invalid',
        message:
          'The uploaded sheet contained no dataLayer.push call with an event.'
      });
    });

    it('returns invalid with exact message when recognized table contains only blank rows', () => {
      const table: string[][] = [['dataLayer Specs'], [''], ['   '], []];
      expect(parseLegacySpecsTable(table)).toEqual({
        kind: 'invalid',
        message:
          'The uploaded sheet contained no dataLayer.push call with an event.'
      });
    });
  });
});
