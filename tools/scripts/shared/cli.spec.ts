import { describe, expect, it } from 'vitest';
import {
  getFlagValue,
  hasFlag,
  readRequiredValue,
  stripFlagWithValue,
  stripNpmPassthroughSeparator
} from './cli.ts';

describe('stripNpmPassthroughSeparator', () => {
  it('drops a leading "--" separator', () => {
    expect(stripNpmPassthroughSeparator(['--', '-x', '-y'])).toEqual([
      '-x',
      '-y'
    ]);
  });

  it('returns the input unchanged when no leading "--" is present', () => {
    expect(stripNpmPassthroughSeparator(['-x'])).toEqual(['-x']);
    expect(stripNpmPassthroughSeparator([])).toEqual([]);
  });
});

describe('hasFlag', () => {
  it('returns true when the flag is present', () => {
    expect(hasFlag(['-a', '--flag', '-b'], '--flag')).toBe(true);
  });

  it('returns false when the flag is missing', () => {
    expect(hasFlag(['-a'], '--flag')).toBe(false);
  });
});

describe('getFlagValue', () => {
  it('returns the value following the flag', () => {
    expect(getFlagValue(['--name', 'alice', '--other'], '--name')).toBe(
      'alice'
    );
  });

  it('returns undefined when the flag is missing', () => {
    expect(getFlagValue(['--other'], '--name')).toBeUndefined();
  });

  it('returns undefined when the flag is the final argument', () => {
    expect(getFlagValue(['--name'], '--name')).toBeUndefined();
  });
});

describe('stripFlagWithValue', () => {
  it('removes both the flag and its value', () => {
    expect(
      stripFlagWithValue(['--name', 'alice', '--other', 'x'], '--name')
    ).toEqual(['--other', 'x']);
  });

  it('returns a copy when the flag is not present', () => {
    expect(stripFlagWithValue(['--other'], '--name')).toEqual(['--other']);
  });
});

describe('readRequiredValue', () => {
  it('returns the value at index+1', () => {
    expect(readRequiredValue(['--name', 'alice'], 0, '--name')).toBe('alice');
  });

  it('throws when the value is missing', () => {
    expect(() => readRequiredValue(['--name'], 0, '--name')).toThrow(
      /Missing value for --name/
    );
  });
});
