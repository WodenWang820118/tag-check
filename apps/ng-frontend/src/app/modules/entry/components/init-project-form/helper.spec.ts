import { describe, expect, it } from 'vitest';
import { FormControl, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from './helper';

describe('InstantErrorStateMatcher', () => {
  const matcher = new InstantErrorStateMatcher();

  it('returns false when control is null', () => {
    expect(matcher.isErrorState(null, null)).toBe(false);
  });

  it('returns false for valid touched control', () => {
    const c = new FormControl('x', Validators.required);
    c.markAsTouched();
    expect(matcher.isErrorState(c, null)).toBe(false);
  });

  it('returns true when control is invalid and touched', () => {
    const c = new FormControl('', Validators.required);
    c.markAsTouched();
    expect(matcher.isErrorState(c, null)).toBe(true);
  });

  it('returns true when control is invalid and form is submitted', () => {
    const c = new FormControl('', Validators.required);
    expect(matcher.isErrorState(c, { submitted: true } as never)).toBe(true);
  });

  it('returns false when invalid but untouched and no submitted form', () => {
    const c = new FormControl('', Validators.required);
    expect(matcher.isErrorState(c, null)).toBe(false);
  });

  describe('allowedCharactersValidator', () => {
    const validator = matcher.allowedCharactersValidator(/^[a-z]+$/);

    it('returns null when value matches the pattern', () => {
      expect(validator(new FormControl('abc'))).toBeNull();
    });

    it('returns invalidCharacters error when value violates the pattern', () => {
      expect(validator(new FormControl('A1'))).toEqual({
        invalidCharacters: true
      });
    });
  });
});
