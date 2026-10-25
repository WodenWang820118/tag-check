import { describe, expect, it } from 'vitest';
import { isQueryFlagOn } from './query-flag';

describe('isQueryFlagOn', () => {
  it.each(['true', '1'])('reads %j as on', (value) => {
    expect(isQueryFlagOn(value)).toBe(true);
  });

  it.each([undefined, '', 'false', '0', 'yes', 'TRUE'])(
    'reads %j as off',
    (value) => {
      expect(isQueryFlagOn(value)).toBe(false);
    }
  );
});
