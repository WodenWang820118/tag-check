import { TestBed } from '@angular/core/testing';
import { EsvExtractService } from './esv-extract.service';

describe('EsvExtractService', () => {
  let svc: EsvExtractService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(EsvExtractService);
  });

  describe('isEventSettingsVariable', () => {
    it('returns true for a valid object', () => {
      expect(
        svc.isEventSettingsVariable({
          name: 'esv',
          parameters: [{ key: 'a', value: 'b' }]
        })
      ).toBe(true);
    });

    it('throws when input is not an object', () => {
      expect(() => svc.isEventSettingsVariable(null)).toThrow(TypeError);
      expect(() => svc.isEventSettingsVariable('x')).toThrow(TypeError);
    });

    it('throws when name is not a string', () => {
      expect(() =>
        svc.isEventSettingsVariable({ name: 1, parameters: [] })
      ).toThrow(/name property/);
    });

    it('throws when parameters is not an array', () => {
      expect(() =>
        svc.isEventSettingsVariable({ name: 'n', parameters: 'no' })
      ).toThrow(/parameters must be an array/);
    });

    it('throws when a parameter entry is not an object', () => {
      expect(() =>
        svc.isEventSettingsVariable({ name: 'n', parameters: [null] })
      ).toThrow(/parameters\[0\]/);
    });

    it('throws when a parameter value is not a string', () => {
      expect(() =>
        svc.isEventSettingsVariable({
          name: 'n',
          parameters: [{ k: 1 }]
        })
      ).toThrow(/parameters\[0\]\[k\]/);
    });
  });

  describe('parseEventSettingVariables', () => {
    it('parses valid JSON', () => {
      const raw = JSON.stringify({
        name: 'esv',
        parameters: [{ key: 'a', value: 'b' }]
      });
      expect(svc.parseEventSettingVariables(raw)).toEqual({
        name: 'esv',
        parameters: [{ key: 'a', value: 'b' }]
      });
    });

    it('wraps non-TypeError errors in a TypeError', () => {
      expect(() => svc.parseEventSettingVariables('not-json')).toThrow(
        /Failed to parse EventSettingsVariable/
      );
    });

    it('preserves TypeError for invalid shape', () => {
      const raw = JSON.stringify({ name: 1, parameters: [] });
      expect(() => svc.parseEventSettingVariables(raw)).toThrow(
        /name property/
      );
    });
  });
});
