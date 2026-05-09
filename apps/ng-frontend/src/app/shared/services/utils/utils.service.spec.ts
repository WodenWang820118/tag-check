import { TestBed } from '@angular/core/testing';
import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  let svc: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(UtilsService);
  });

  describe('isEmptyObject', () => {
    it('treats null, undefined, and empty string as empty', () => {
      expect(svc.isEmptyObject(null)).toBe(true);
      expect(svc.isEmptyObject(undefined)).toBe(true);
      expect(svc.isEmptyObject('')).toBe(true);
    });

    it('returns false for primitives that are not empty', () => {
      expect(svc.isEmptyObject(0)).toBe(false);
      expect(svc.isEmptyObject('text')).toBe(false);
      expect(svc.isEmptyObject(false)).toBe(false);
    });

    it('handles arrays', () => {
      expect(svc.isEmptyObject([])).toBe(true);
      expect(svc.isEmptyObject([1])).toBe(false);
    });

    it('Date instances are never empty', () => {
      expect(svc.isEmptyObject(new Date())).toBe(false);
    });

    it('handles Set and Map by size', () => {
      expect(svc.isEmptyObject(new Set())).toBe(true);
      expect(svc.isEmptyObject(new Set([1]))).toBe(false);
      expect(svc.isEmptyObject(new Map())).toBe(true);
      expect(svc.isEmptyObject(new Map([['a', 1]]))).toBe(false);
    });

    it('handles plain objects via own keys and symbols', () => {
      expect(svc.isEmptyObject({})).toBe(true);
      expect(svc.isEmptyObject({ a: 1 })).toBe(false);
      const sym = Symbol('s');
      expect(svc.isEmptyObject({ [sym]: 1 })).toBe(false);
    });
  });

  describe('extractEventNameFromId', () => {
    it('strips a trailing UUID suffix', () => {
      expect(
        svc.extractEventNameFromId(
          'page_view_12345678-1234-1234-1234-123456789abc'
        )
      ).toBe('page_view');
    });

    it('returns the input unchanged when no UUID is present', () => {
      expect(svc.extractEventNameFromId('page_view')).toBe('page_view');
    });

    it('only strips a UUID at the end of the string', () => {
      expect(
        svc.extractEventNameFromId(
          '12345678-1234-1234-1234-123456789abc_page_view'
        )
      ).toBe('12345678-1234-1234-1234-123456789abc_page_view');
    });
  });
});
