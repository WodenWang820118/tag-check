import { describe, expect, it } from 'vitest';
import {
  GA4_MAX_EVENT_PARAMETERS_PER_EVENT,
  getGa4MeasurementPlanTemplateRows,
  isMeasurementPlanHeader,
  measurementPlanToDataLayerSpecs,
  parseMeasurementPlanRows,
  type MeasurementPlanRow
} from './measurement-plan';
import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  GA4_EVENT_NAME_MAX_LENGTH
} from './ga4-reference';

describe('measurement-plan', () => {
  describe('isMeasurementPlanHeader', () => {
    it('returns true when all 3 columns are present in any case or order', () => {
      expect(
        isMeasurementPlanHeader([
          'event_name',
          'event_parameters',
          'item_parameters'
        ])
      ).toBe(true);
      expect(
        isMeasurementPlanHeader([
          'item_parameters',
          'EVENT_NAME',
          'Event_Parameters'
        ])
      ).toBe(true);
    });

    it('returns false when a required column is missing or array is empty', () => {
      expect(isMeasurementPlanHeader([])).toBe(false);
      expect(isMeasurementPlanHeader(undefined)).toBe(false);
      expect(isMeasurementPlanHeader(['event_name', 'event_parameters'])).toBe(
        false
      );
      expect(isMeasurementPlanHeader(['dataLayer Specs'])).toBe(false);
    });
  });

  describe('parseMeasurementPlanRows - header detection', () => {
    it('detects standard lowercase header', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', 'method', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows).toEqual([
        {
          eventName: 'login',
          eventParameters: ['method'],
          itemParameters: []
        }
      ]);
    });

    it('matches header case-insensitively and with whitespace', () => {
      const table = [
        [' EVENT_NAME ', 'Event_Parameters', 'ITEM_PARAMETERS '],
        ['login', 'method', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].eventName).toBe('login');
    });

    it('matches header in any column order', () => {
      const table = [
        ['item_parameters', 'event_name', 'event_parameters'],
        ['item_id', 'add_to_cart', 'currency, value']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows).toEqual([
        {
          eventName: 'add_to_cart',
          eventParameters: ['currency', 'value'],
          itemParameters: ['item_id']
        }
      ]);
    });

    it('reports missing header when table is empty', () => {
      const result = parseMeasurementPlanRows([]);
      expect(result.rows).toEqual([]);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('Missing header row');
    });

    it('reports missing header when a required column is absent', () => {
      const table = [
        ['event_name', 'event_parameters'],
        ['login', 'method']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.rows).toEqual([]);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('Missing header row');
    });
  });

  describe('parseMeasurementPlanRows - blank rows & parameter parsing', () => {
    it('skips empty rows and whitespace-only rows', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        [],
        ['', '   ', ''],
        ['login', 'method', ''],
        ['   ', '', '   '],
        ['sign_up', 'method', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows.map((r) => r.eventName)).toEqual(['login', 'sign_up']);
    });

    it('splits, trims, and drops duplicate parameters in cells', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        [
          'add_to_cart',
          ' currency , value , currency,   , value ',
          ' item_id, price , item_id '
        ]
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows[0].eventParameters).toEqual(['currency', 'value']);
      expect(result.rows[0].itemParameters).toEqual(['item_id', 'price']);
    });
  });

  describe('parseMeasurementPlanRows - issue reporting', () => {
    it('rejects an event parameter that would replace the data layer event name', () => {
      const result = parseMeasurementPlanRows([
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', 'method, event', '']
      ]);

      expect(result.rows).toEqual([]);
      expect(result.issues).toEqual([
        expect.stringMatching(/Row 2:.*"event".*data layer event name/)
      ]);
    });

    it('reports invalid event names that break GA4 naming rules', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['1login', 'method', ''],
        ['user-logout', 'method', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('1login') &&
            issue.includes('must start with a letter')
        )
      ).toBe(true);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 3') &&
            issue.includes('user-logout') &&
            issue.includes('letters, numbers and underscores')
        )
      ).toBe(true);
    });

    it('reports event names exceeding max length', () => {
      const longName = 'a'.repeat(GA4_EVENT_NAME_MAX_LENGTH + 1);
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        [longName, 'method', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes(`must be at most ${GA4_EVENT_NAME_MAX_LENGTH}`)
        )
      ).toBe(true);
    });

    it('reports duplicate event names across rows', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', 'method', ''],
        ['login', 'method', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 3') && issue.includes('Duplicate event name')
        )
      ).toBe(true);
    });

    it('reports invalid event parameter names', () => {
      const longParam = 'p'.repeat(GA4_EVENT_NAME_MAX_LENGTH + 1);
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['custom_event', `1invalid, bad-param, ${longParam}`, '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('1invalid') &&
            issue.includes('must start with a letter')
        )
      ).toBe(true);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('bad-param') &&
            issue.includes('letters, numbers and underscores')
        )
      ).toBe(true);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes(longParam) &&
            issue.includes(`must be at most ${GA4_EVENT_NAME_MAX_LENGTH}`)
        )
      ).toBe(true);
    });

    it('reports invalid item parameter names', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['view_item', 'currency', 'bad-item-id, 2price']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('bad-item-id') &&
            issue.includes('Item parameter')
        )
      ).toBe(true);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('2price') &&
            issue.includes('Item parameter')
        )
      ).toBe(true);
    });

    it('reports events with more than 25 event parameters', () => {
      const params = Array.from(
        { length: GA4_MAX_EVENT_PARAMETERS_PER_EVENT + 1 },
        (_, i) => `param_${i}`
      );
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['large_event', params.join(', '), '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('exceeding the maximum of 25')
        )
      ).toBe(true);
    });
  });

  describe('parseMeasurementPlanRows - rule syntax in cells', () => {
    it('parses each rule kind: any, equals (strings, numbers, booleans, quoted) and regex', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        [
          'purchase',
          'currency=TWD, value=10, in_stock=true, level="10", transaction_id=/^T\\d+$/, coupon',
          'item_id=/^SKU-/i, price=99.99, is_featured=false, item_name'
        ]
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].eventName).toBe('purchase');
      expect(result.rows[0].eventParameters).toEqual([
        'currency=TWD',
        'value=10',
        'in_stock=true',
        'level="10"',
        'transaction_id=/^T\\d+$/',
        'coupon'
      ]);
      expect(result.rows[0].itemParameters).toEqual([
        'item_id=/^SKU-/i',
        'price=99.99',
        'is_featured=false',
        'item_name'
      ]);
      expect(result.rows[0].eventRules).toEqual([
        { kind: 'equals', name: 'currency', value: 'TWD' },
        { kind: 'equals', name: 'value', value: 10 },
        { kind: 'equals', name: 'in_stock', value: true },
        { kind: 'equals', name: 'level', value: '10' },
        { kind: 'pattern', name: 'transaction_id', pattern: '^T\\d+$' },
        { kind: 'any', name: 'coupon' }
      ]);
      expect(result.rows[0].itemRules).toEqual([
        { kind: 'pattern', name: 'item_id', pattern: '^SKU-', flags: 'i' },
        { kind: 'equals', name: 'price', value: 99.99 },
        { kind: 'equals', name: 'is_featured', value: false },
        { kind: 'any', name: 'item_name' }
      ]);
    });

    it('trims spaces around parameter names and values in rules', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', '  method =  google ,  attempts = 1  ', '']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows[0].eventRules).toEqual([
        { kind: 'equals', name: 'method', value: 'google' },
        { kind: 'equals', name: 'attempts', value: 1 }
      ]);
    });

    it('splits cells containing regular expressions with commas and flags', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        [
          'purchase',
          'transaction_id=/^T\\d{1,3}$/, coupon=/PROMO_\\d{2,4}/i, currency=TWD',
          'item_id=/^SKU-\\d{1,5}$/'
        ]
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows[0].eventParameters).toEqual([
        'transaction_id=/^T\\d{1,3}$/',
        'coupon=/PROMO_\\d{2,4}/i',
        'currency=TWD'
      ]);
      expect(result.rows[0].eventRules).toEqual([
        { kind: 'pattern', name: 'transaction_id', pattern: '^T\\d{1,3}$' },
        {
          kind: 'pattern',
          name: 'coupon',
          pattern: 'PROMO_\\d{2,4}',
          flags: 'i'
        },
        { kind: 'equals', name: 'currency', value: 'TWD' }
      ]);
    });

    it('reports an invalid regex as a plan issue with the row number without crashing', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['purchase', 'transaction_id=/[', 'item_id=/unclosed']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toHaveLength(2);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('transaction_id') &&
            issue.includes('invalid regular expression')
        )
      ).toBe(true);
      expect(
        result.issues.some(
          (issue) =>
            issue.includes('Row 2') &&
            issue.includes('item_id') &&
            issue.includes('invalid regular expression')
        )
      ).toBe(true);
    });

    it('keeps old plans without rules completely unchanged and backward-compatible', () => {
      const table = [
        ['event_name', 'event_parameters', 'item_parameters'],
        ['login', 'method', ''],
        ['purchase', 'currency, value', 'item_id, price']
      ];
      const result = parseMeasurementPlanRows(table);
      expect(result.issues).toEqual([]);
      expect(result.rows).toEqual([
        {
          eventName: 'login',
          eventParameters: ['method'],
          itemParameters: []
        },
        {
          eventName: 'purchase',
          eventParameters: ['currency', 'value'],
          itemParameters: ['item_id', 'price']
        }
      ]);
    });
  });

  describe('measurementPlanToDataLayerSpecs', () => {
    it.each(['constructor', 'toString', 'valueOf'])(
      'keeps parameters flat for the custom event %s',
      (eventName) => {
        expect(
          measurementPlanToDataLayerSpecs([
            { eventName, eventParameters: ['method'], itemParameters: [] }
          ])
        ).toEqual([{ event: eventName, method: '$method' }]);
      }
    );

    it('rejects event parameters that would overwrite the event name even without parsing', () => {
      expect(() =>
        measurementPlanToDataLayerSpecs([
          {
            eventName: 'login',
            eventParameters: ['event'],
            itemParameters: []
          }
        ])
      ).toThrow(/"event".*data layer event name/);
    });

    it('places parameters at top level for non-ecommerce events without item parameters', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'login',
          eventParameters: ['method'],
          itemParameters: []
        },
        {
          eventName: 'generate_lead',
          eventParameters: ['currency', 'value'],
          itemParameters: []
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs).toEqual([
        {
          event: 'login',
          method: '$method'
        },
        {
          event: 'generate_lead',
          currency: '$currency',
          value: '$value'
        }
      ]);
    });

    it('places parameters inside ecommerce for events in GA4_ECOMMERCE_EVENT_PARAMETERS', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'add_to_cart',
          eventParameters: ['currency', 'value'],
          itemParameters: []
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs).toEqual([
        {
          event: 'add_to_cart',
          ecommerce: {
            currency: '$currency',
            value: '$value'
          }
        }
      ]);
    });

    it('places parameters inside ecommerce when item parameters are present even if not in ecommerce list', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'custom_catalog_action',
          eventParameters: ['catalog_id'],
          itemParameters: ['item_id', 'item_name']
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs).toEqual([
        {
          event: 'custom_catalog_action',
          ecommerce: {
            catalog_id: '$catalog_id',
            items: [
              {
                item_id: '$item_id',
                item_name: '$item_name'
              }
            ]
          }
        }
      ]);
    });

    it('adds items array inside ecommerce when item parameters are present', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'purchase',
          eventParameters: ['currency', 'transaction_id', 'value'],
          itemParameters: ['item_id', 'price', 'quantity']
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs[0]).toEqual({
        event: 'purchase',
        ecommerce: {
          currency: '$currency',
          transaction_id: '$transaction_id',
          value: '$value',
          items: [
            {
              item_id: '$item_id',
              price: '$price',
              quantity: '$quantity'
            }
          ]
        }
      });
    });

    it('ensures listed items event parameter is an array, never a scalar string', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'view_cart',
          eventParameters: ['currency', 'value', 'items'],
          itemParameters: []
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs[0]).toEqual({
        event: 'view_cart',
        ecommerce: {
          currency: '$currency',
          value: '$value',
          items: []
        }
      });
      // Explicitly check that items is an array, not a scalar "$items"
      expect(Array.isArray(specs[0].ecommerce?.items)).toBe(true);
    });

    it('ensures listed items with item parameters creates populated items array', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'view_cart',
          eventParameters: ['currency', 'value', 'items'],
          itemParameters: ['item_id', 'price']
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs[0].ecommerce?.items).toEqual([
        {
          item_id: '$item_id',
          price: '$price'
        }
      ]);
    });

    it('generates spec expectations from rules for event and item parameters', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'purchase',
          eventParameters: [
            'currency=TWD',
            'value=100',
            'in_stock=true',
            'transaction_id=/^T\\d+$/',
            'coupon'
          ],
          itemParameters: [
            'item_id=/^SKU-\\d{1,3}$/i',
            'price=50',
            'item_name="123"',
            'quantity'
          ]
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs).toEqual([
        {
          event: 'purchase',
          ecommerce: {
            currency: 'TWD',
            value: 100,
            in_stock: true,
            transaction_id: '/^T\\d+$/',
            coupon: '$coupon',
            items: [
              {
                item_id: '/^SKU-\\d{1,3}$/i',
                price: 50,
                item_name: '123',
                quantity: '$quantity'
              }
            ]
          }
        }
      ]);
    });

    it('generates spec expectations for non-ecommerce events with rules', () => {
      const rows: MeasurementPlanRow[] = [
        {
          eventName: 'login',
          eventParameters: [
            'method="google"',
            'attempts=3',
            'success=true',
            'session_id=/^S\\d+$/',
            'user_id'
          ],
          itemParameters: []
        }
      ];
      const specs = measurementPlanToDataLayerSpecs(rows);
      expect(specs).toEqual([
        {
          event: 'login',
          method: 'google',
          attempts: 3,
          success: true,
          session_id: '/^S\\d+$/',
          user_id: '$user_id'
        }
      ]);
    });
  });

  describe('getGa4MeasurementPlanTemplateRows()', () => {
    it('parses every template row without any issues', () => {
      const header = ['event_name', 'event_parameters', 'item_parameters'];
      const dataRows = getGa4MeasurementPlanTemplateRows().map((row) => [
        row.eventName,
        row.eventParameters.join(', '),
        row.itemParameters.join(', ')
      ]);
      const table = [header, ...dataRows];

      const { rows, issues } = parseMeasurementPlanRows(table);
      expect(issues).toEqual([]);
      expect(rows).toEqual(getGa4MeasurementPlanTemplateRows());
    });

    it('contains all documented recommended ecommerce events with common item parameters and standard events', () => {
      const eventNames = getGa4MeasurementPlanTemplateRows().map(
        (r) => r.eventName
      );
      // Ecommerce events
      expect(eventNames).toContain('add_to_cart');
      expect(eventNames).toContain('purchase');
      expect(eventNames).toContain('refund');
      expect(eventNames).toContain('begin_checkout');
      // Standard events
      expect(eventNames).toContain('login');
      expect(eventNames).toContain('sign_up');
      expect(eventNames).toContain('search');
      expect(eventNames).toContain('share');
      expect(eventNames).toContain('select_content');
      expect(eventNames).toContain('generate_lead');

      const addToCart = getGa4MeasurementPlanTemplateRows().find(
        (r) => r.eventName === 'add_to_cart'
      );
      expect(addToCart?.eventParameters).toEqual(['currency', 'value']);
      expect(addToCart?.itemParameters).toEqual([
        'item_id',
        'item_name',
        'item_brand',
        'item_category',
        'item_variant',
        'price',
        'quantity'
      ]);

      const login = getGa4MeasurementPlanTemplateRows().find(
        (r) => r.eventName === 'login'
      );
      expect(login?.eventParameters).toEqual(['method']);
      expect(login?.itemParameters).toEqual([]);
    });

    // Each event's parameters as listed in Google's recommended events
    // reference (checked 2026-10-25):
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
    it('lists the documented parameters of every non-ecommerce event', () => {
      const rows = getGa4MeasurementPlanTemplateRows().filter(
        (row) => !Object.hasOwn(GA4_ECOMMERCE_EVENT_PARAMETERS, row.eventName)
      );
      expect(
        Object.fromEntries(
          rows.map((row) => [row.eventName, row.eventParameters])
        )
      ).toEqual({
        login: ['method'],
        sign_up: ['method'],
        search: ['search_term'],
        share: ['method', 'content_type', 'item_id'],
        select_content: ['content_type', 'content_id'],
        generate_lead: ['currency', 'value', 'lead_source']
      });
      expect(rows.every((row) => row.itemParameters.length === 0)).toBe(true);
    });
  });
});
