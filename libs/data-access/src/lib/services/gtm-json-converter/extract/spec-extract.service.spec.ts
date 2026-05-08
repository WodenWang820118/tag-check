import { TestBed } from '@angular/core/testing';
import { SpecExtractService } from './spec-extract.service';
import { vi } from 'vitest';

describe('SpecExtractService', () => {
  let service: SpecExtractService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpecExtractService]
    });
    service = TestBed.inject(SpecExtractService);
  });

  it('normalizes a single event object into an array', () => {
    expect(service.preprocessInput('{ "event": "page_view" }')).toEqual([
      { event: 'page_view' }
    ]);
  });

  it('passes through a valid multi-event array', () => {
    expect(
      service.preprocessInput(
        '[{ "event": "page_view" }, { "event": "purchase", "value": "799" }]'
      )
    ).toEqual([{ event: 'page_view' }, { event: 'purchase', value: '799' }]);
  });

  it('repairs lightly malformed JSON input before parsing', () => {
    expect(service.preprocessInput('[{ event: page_view }]')).toEqual([
      { event: 'page_view' }
    ]);
  });

  it('repairs comments and trailing commas before parsing', () => {
    expect(
      service.preprocessInput(`[
        /* comment */
        {
          event: page_view, // tracking
        },
      ]`)
    ).toEqual([{ event: 'page_view' }]);
  });

  it('throws when semantically invalid JSON cannot be normalized into event objects', () => {
    expect(() =>
      service.preprocessInput('[{ "name": "missing event" }]')
    ).toThrow('Error parsing spec JSON. Please check the format.');
  });

  it('does not attempt JSON repair when valid JSON fails schema normalization', () => {
    const repairSpy = vi.spyOn(service, 'fixJsonString');

    expect(() =>
      service.preprocessInput('[{ "name": "missing event" }]')
    ).toThrow('Error parsing spec JSON. Please check the format.');
    expect(repairSpy).not.toHaveBeenCalled();
  });

  it('throws when repaired JSON still fails event normalization', () => {
    const repairSpy = vi.spyOn(service, 'fixJsonString');

    expect(() =>
      service.preprocessInput("[{ 'name': 'missing event' }]")
    ).toThrow('Error parsing spec JSON. Please check the format.');
    expect(repairSpy).toHaveBeenCalledTimes(1);
  });

  it('throws when the input cannot be repaired into valid JSON', () => {
    expect(() => service.preprocessInput('}}garbage{{')).toThrow(
      'Error parsing spec JSON. Please check the format.'
    );
  });

  it('leaves already valid JSON unchanged when applying repair helpers', () => {
    const input = '[{ "event": "page_view" }]';

    expect(service.fixJsonString(input)).toBe(input);
  });

  it('preserves apostrophes inside already double-quoted strings', () => {
    const input = '{ "message": "It\'s working" }';

    expect(service.fixJsonString(input)).toBe(input);
  });

  it('documents that standalone line comments are not repaired', () => {
    expect(() =>
      service.preprocessInput(`[
          // unsupported standalone comment
          { "event": "page_view" }
        ]`)
    ).toThrow('Error parsing spec JSON. Please check the format.');
  });

  describe('fixJsonString edge cases', () => {
    it('should repair nested objects with unquoted keys', () => {
      const input = '{ event: page_view, params: { key: value } }';
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        event: 'page_view',
        params: { key: 'value' }
      });
    });

    it('should preserve boolean and null literals without quoting them', () => {
      const input = '{ active: true, count: 0, empty: null }';
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed.active).toBe(true);
      expect(parsed.empty).toBe(null);
      // Note: numeric 0 becomes "0" — the regex-based repair cannot
      // distinguish numeric literals from unquoted string values.
    });

    it('should repair multiple trailing commas in nested arrays and objects', () => {
      const input = '[{ event: page_view, }, { event: purchase, },]';
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].event).toBe('page_view');
      expect(parsed[1].event).toBe('purchase');
    });

    it('should handle empty objects and arrays', () => {
      const input = '{ items: [], meta: {} }';
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed.items).toEqual([]);
      expect(parsed.meta).toEqual({});
    });

    it('should handle unquoted numeric values (treated as strings by repair)', () => {
      // The regex repair treats all unquoted values as strings.
      // This is a known limitation; users should quote values explicitly.
      const input = '{ event: purchase, value: 799.99, quantity: 3 }';
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      // Numbers become strings after repair
      expect(typeof parsed.value).toBe('string');
      expect(parsed.value).toBe('799.99');
      expect(parsed.quantity).toBe('3');
    });

    it('should handle single-quoted keys and values in nested structures', () => {
      const input =
        "[{ 'event': 'page_view', 'ecommerce': { 'value': '799' } }]";
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed[0].event).toBe('page_view');
      expect(parsed[0].ecommerce.value).toBe('799');
    });

    it('should repair unquoted single-word values even with mixed quoting', () => {
      const input = '{ "event": page_view, "value": 100 }';
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed.event).toBe('page_view');
      // Numbers become strings through regex repair
      expect(parsed.value).toBe('100');
    });

    it('should repair a realistic multi-event spec with various issues', () => {
      // Note: unquoted values with spaces (like "Product A") are NOT repaired
      // by the current regex. Use single-quoted or double-quoted values instead.
      const input = `[
        {
          event: page_view,
          page_location: /home, // comment
          page_title: 'Welcome',
        },
        {
          event: purchase,
          ecommerce: {
            value: 799.99,
            currency: TWD,
            items: [
              { item_name: 'Product A', quantity: 1, },
            ],
          }
        }
      ]`;
      const result = service.fixJsonString(input);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      // Numbers become strings through repair
      expect(parsed[1].ecommerce.value).toBe('799.99');
      expect(parsed[1].ecommerce.items[0].item_name).toBe('Product A');
    });
  });
});
