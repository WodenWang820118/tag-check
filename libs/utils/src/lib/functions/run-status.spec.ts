import { describe, expect, it } from 'vitest';
import { getCheckStatus } from './run-status';

describe('getCheckStatus', () => {
  it('passes when both checks passed', () => {
    expect(getCheckStatus(true, true)).toBe('passed');
  });

  it('is partial when only one check passed', () => {
    expect(getCheckStatus(true, false)).toBe('partial');
    expect(getCheckStatus(false, true)).toBe('partial');
  });

  it('fails when neither check passed or a result is missing', () => {
    expect(getCheckStatus(false, false)).toBe('failed');
    expect(getCheckStatus(undefined, undefined)).toBe('failed');
  });
});
