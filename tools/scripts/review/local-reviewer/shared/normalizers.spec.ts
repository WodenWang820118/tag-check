import { describe, expect, it } from 'vitest';
import {
  normalizeHybridPath,
  normalizeLocalReviewSeverity,
  normalizeOptionalLineNumber,
  normalizeOptionalText
} from './normalizers.ts';

describe('normalizeHybridPath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(normalizeHybridPath('a\\b\\c.ts')).toBe('a/b/c.ts');
  });

  it('strips a leading "./" prefix when the input has no leading whitespace', () => {
    expect(normalizeHybridPath('./src/file.ts')).toBe('src/file.ts');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeHybridPath('  src/file.ts  ')).toBe('src/file.ts');
  });

  it('leaves already-clean paths untouched', () => {
    expect(normalizeHybridPath('src/file.ts')).toBe('src/file.ts');
  });
});

describe('normalizeLocalReviewSeverity', () => {
  it.each(['critical', 'high', 'medium', 'low', 'info'] as const)(
    'returns %s when given a recognized severity',
    (severity) => {
      expect(normalizeLocalReviewSeverity(severity)).toBe(severity);
    }
  );

  it('falls back to "info" for unknown values', () => {
    expect(normalizeLocalReviewSeverity('blocker')).toBe('info');
    expect(normalizeLocalReviewSeverity(42)).toBe('info');
    expect(normalizeLocalReviewSeverity(null)).toBe('info');
  });
});

describe('normalizeOptionalText', () => {
  it('returns null for null and undefined', () => {
    expect(normalizeOptionalText(null)).toBeNull();
    expect(normalizeOptionalText(undefined)).toBeNull();
  });

  it('returns null when the string is blank', () => {
    expect(normalizeOptionalText('   ')).toBeNull();
  });

  it('returns the trimmed string when content is present', () => {
    expect(normalizeOptionalText('  hello  ')).toBe('hello');
    expect(normalizeOptionalText(123)).toBe('123');
  });
});

describe('normalizeOptionalLineNumber', () => {
  it('returns null for null, undefined, or empty input', () => {
    expect(normalizeOptionalLineNumber(null)).toBeNull();
    expect(normalizeOptionalLineNumber(undefined)).toBeNull();
    expect(normalizeOptionalLineNumber('')).toBeNull();
  });

  it('parses positive integer strings', () => {
    expect(normalizeOptionalLineNumber('42')).toBe(42);
  });

  it('returns null for zero, negative, or non-integer numbers', () => {
    expect(normalizeOptionalLineNumber(0)).toBeNull();
    expect(normalizeOptionalLineNumber(-5)).toBeNull();
    expect(normalizeOptionalLineNumber(1.5)).toBeNull();
    expect(normalizeOptionalLineNumber('abc')).toBeNull();
  });
});
