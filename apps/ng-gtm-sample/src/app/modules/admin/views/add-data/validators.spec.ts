import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { latitudeValidator, longitudeValidator } from './validators';

describe('add-data validators', () => {
  it('accepts empty and null latitude and longitude values until required validation runs', () => {
    expect(latitudeValidator()(new FormControl(''))).toBeNull();
    expect(latitudeValidator()(new FormControl(null))).toBeNull();
    expect(latitudeValidator()(new FormControl(undefined))).toBeNull();
    expect(longitudeValidator()(new FormControl(''))).toBeNull();
    expect(longitudeValidator()(new FormControl(null))).toBeNull();
    expect(longitudeValidator()(new FormControl(undefined))).toBeNull();
  });

  it('accepts boundary latitude and longitude values', () => {
    expect(latitudeValidator()(new FormControl('90'))).toBeNull();
    expect(latitudeValidator()(new FormControl('-90'))).toBeNull();
    expect(latitudeValidator()(new FormControl('0'))).toBeNull();
    expect(longitudeValidator()(new FormControl('180'))).toBeNull();
    expect(longitudeValidator()(new FormControl('-180'))).toBeNull();
    expect(longitudeValidator()(new FormControl('0'))).toBeNull();
  });

  it('rejects invalid latitude values', () => {
    expect(latitudeValidator()(new FormControl('91'))).toEqual({
      invalidLatitude: true
    });
    expect(latitudeValidator()(new FormControl('-91'))).toEqual({
      invalidLatitude: true
    });
    expect(latitudeValidator()(new FormControl('north'))).toEqual({
      invalidLatitude: true
    });
  });

  it('rejects invalid longitude values', () => {
    expect(longitudeValidator()(new FormControl('181'))).toEqual({
      invalidLongitude: true
    });
    expect(longitudeValidator()(new FormControl('-181'))).toEqual({
      invalidLongitude: true
    });
    expect(longitudeValidator()(new FormControl('east'))).toEqual({
      invalidLongitude: true
    });
  });
});
