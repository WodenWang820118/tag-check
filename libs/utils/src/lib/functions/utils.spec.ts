import { describe, expect, it } from 'vitest';
import { extractEventNameFromId } from './utils';

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
