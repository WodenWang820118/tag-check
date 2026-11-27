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

  it('judges a run without the request check by its data layer check alone', () => {
    expect(getCheckStatus(true, false, false)).toBe('passed');
    expect(getCheckStatus(false, false, false)).toBe('failed');
  });

  it('reads a missing requestChecked as a run that made the request check', () => {
    expect(getCheckStatus(true, false, undefined)).toBe('partial');
  });
});
