import { describe, expect, it } from 'vitest';
import {
  median,
  mulberry32,
  shortHash,
  shuffleWithSeed
} from './sampling-utils.ts';

describe('mulberry32', () => {
  it('produces deterministic floats in the range [0, 1) for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 5; i += 1) {
      const va = a();
      const vb = b();
      expect(va).toBe(vb);
      expect(va).toBeGreaterThanOrEqual(0);
      expect(va).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });
});

describe('shuffleWithSeed', () => {
  it('returns a permutation containing the same elements (no loss, no dupes)', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffleWithSeed(input, 7);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('returns the same order for the same seed (deterministic)', () => {
    const a = shuffleWithSeed([1, 2, 3, 4, 5, 6, 7], 99);
    const b = shuffleWithSeed([1, 2, 3, 4, 5, 6, 7], 99);
    expect(a).toEqual(b);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    const snapshot = [...input];
    shuffleWithSeed(input, 1);
    expect(input).toEqual(snapshot);
  });
});

describe('shortHash', () => {
  it('returns the first 7 characters of a commit hash', () => {
    expect(shortHash('abcdef0123456789')).toBe('abcdef0');
    expect(shortHash('abc')).toBe('abc');
  });
});

describe('median', () => {
  it('returns 0 for an empty array', () => {
    expect(median([])).toBe(0);
  });

  it('returns the middle value for odd-length arrays', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('returns the rounded mean of the two middles for even-length arrays', () => {
    expect(median([1, 2, 3, 4])).toBe(3); // round((2+3)/2) = round(2.5) = 3
    expect(median([1, 2, 4, 5])).toBe(3); // (2+4)/2 = 3
  });
});
