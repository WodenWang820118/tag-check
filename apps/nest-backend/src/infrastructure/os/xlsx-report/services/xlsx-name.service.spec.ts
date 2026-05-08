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
});
