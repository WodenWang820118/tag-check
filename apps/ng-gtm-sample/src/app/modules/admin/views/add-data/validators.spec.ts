import { describe, expect, it } from 'vitest';
import { isValidLatitude, isValidLongitude } from './validators';

describe('add-data validators', () => {
  it('accepts empty and null latitude and longitude values until required validation runs', () => {
    expect(isValidLatitude('')).toBe(true);
    expect(isValidLatitude(null)).toBe(true);
    expect(isValidLatitude(undefined)).toBe(true);
    expect(isValidLongitude('')).toBe(true);
    expect(isValidLongitude(null)).toBe(true);
    expect(isValidLongitude(undefined)).toBe(true);
  });

  it('accepts boundary latitude and longitude values', () => {
    expect(isValidLatitude('90')).toBe(true);
    expect(isValidLatitude('-90')).toBe(true);
    expect(isValidLatitude('0')).toBe(true);
    expect(isValidLongitude('180')).toBe(true);
    expect(isValidLongitude('-180')).toBe(true);
    expect(isValidLongitude('0')).toBe(true);
  });

  it('rejects invalid latitude values', () => {
    expect(isValidLatitude('91')).toBe(false);
    expect(isValidLatitude('-91')).toBe(false);
    expect(isValidLatitude('north')).toBe(false);
  });

  it('rejects invalid longitude values', () => {
    expect(isValidLongitude('181')).toBe(false);
    expect(isValidLongitude('-181')).toBe(false);
    expect(isValidLongitude('east')).toBe(false);
  });
});
