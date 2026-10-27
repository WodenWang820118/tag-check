import { describe, expect, it } from 'vitest';
import { keepBothTestName } from './gtm-import';

describe('keepBothTestName', () => {
  it('starts at (1) and skips numbers that are already taken', () => {
    const taken = new Set(['Purchase', 'Purchase (1)', 'Purchase (3)']);
    expect(keepBothTestName('Purchase', taken)).toBe('Purchase (2)');
  });

  it('treats the whole tag name as the base, including an existing suffix', () => {
    expect(keepBothTestName('Purchase (1)', new Set(['Purchase (1)']))).toBe(
      'Purchase (1) (1)'
    );
  });
});
