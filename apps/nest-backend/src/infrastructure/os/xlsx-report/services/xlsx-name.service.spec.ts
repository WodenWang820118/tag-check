import { describe, expect, it } from 'vitest';
import { XlsxNameService } from './xlsx-name.service';

describe('XlsxNameService', () => {
  const service = new XlsxNameService();

  it('returns short names unchanged', () => {
    expect(service.sanitiseWorksheetName('Report')).toBe('Report');
  });

  it('replaces forbidden characters (: \\ / ? * [ ]) with single spaces and trims', () => {
    expect(service.sanitiseWorksheetName('a:b/c\\d?e*f[g]h')).toBe(
      'a b c d e f g h'
    );
  });

  it('truncates long names to "<first 15>…<last 15>"', () => {
    const long = 'A'.repeat(20) + 'B'.repeat(20);
    const result = service.sanitiseWorksheetName(long);
    expect(result.length).toBe(31);
    expect(result.startsWith('A'.repeat(15))).toBe(true);
    expect(result.endsWith('B'.repeat(15))).toBe(true);
    expect(result.includes('…')).toBe(true);
  });

  it('collapses consecutive whitespace into a single space', () => {
    expect(service.sanitiseWorksheetName('a   b\t\tc')).toBe('a b c');
  });

  it('strips leading and trailing apostrophes, which Excel rejects', () => {
    expect(service.sanitiseWorksheetName("'quoted'")).toBe('quoted');
  });

  it('names an otherwise empty sheet "Test"', () => {
    expect(service.sanitiseWorksheetName(' / ')).toBe('Test');
  });

  it('suffixes names that collide, ignoring case, within 31 characters', () => {
    const taken = new Set<string>();
    const first = service.uniqueWorksheetName(
      'Checkout step one, guest - begin_checkout',
      taken
    );
    const second = service.uniqueWorksheetName(
      'Checkout step one, member - begin_checkout',
      taken
    );
    const third = service.uniqueWorksheetName(first.toUpperCase(), taken);

    expect(first).toBe('Checkout step o… begin_checkout');
    expect(second).toBe('Checkout step o… begin_chec (2)');
    expect(third).toBe('CHECKOUT STEP O… BEGIN_CHEC (3)');
    expect(second.length).toBeLessThanOrEqual(31);
  });
});
