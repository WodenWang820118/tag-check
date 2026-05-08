import { describe, expect, it } from 'vitest';
import { XlsxUtilsService } from './xlsx-utils.service';

describe('XlsxUtilsService', () => {
  const service = new XlsxUtilsService();

  it('returns "{}" for an empty object', () => {
    expect(service.formatJsonForExcel({})).toBe('{}');
  });

  it('returns a pretty-printed (2-space) JSON string for normal objects', () => {
    const result = service.formatJsonForExcel({ a: 1, b: { c: 2 } });
    expect(result).toBe(JSON.stringify({ a: 1, b: { c: 2 } }, null, 2));
    expect(result).toContain('\n');
  });

  it('falls back to String(value) when JSON serialization throws', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    const result = service.formatJsonForExcel(cyclic);
    expect(typeof result).toBe('string');
  });
});
