import { describe, expect, it, afterEach, vi } from 'vitest';
import { extractEventNameFromId, getCurrentTimestamp } from './utils';

describe('getCurrentTimestamp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats the current date as YYYY-MM-DD_HHMMSS with zero padding', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 5, 9, 7, 3));

    expect(getCurrentTimestamp()).toBe('2024-01-05_090703');
  });

  it('uses two-digit fields for end-of-year, end-of-day values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 11, 31, 23, 59, 59));

    expect(getCurrentTimestamp()).toBe('2025-12-31_235959');
  });
});

describe('extractEventNameFromId', () => {
  it('strips a trailing _<uuid> suffix', () => {
    const id = 'add_to_cart_12345678-1234-1234-1234-1234567890ab';
    expect(extractEventNameFromId(id)).toBe('add_to_cart');
  });

  it('matches the suffix case-insensitively', () => {
    const id = 'purchase_ABCDEF12-3456-7890-ABCD-1234567890AB';
    expect(extractEventNameFromId(id)).toBe('purchase');
  });

  it('returns the input unchanged when there is no UUID suffix', () => {
    expect(extractEventNameFromId('view_item')).toBe('view_item');
  });

  it('only strips the suffix at the end of the string', () => {
    const id = 'no_uuid_12345678-1234-1234-1234-1234567890ab_trailing';
    expect(extractEventNameFromId(id)).toBe(id);
  });
});
