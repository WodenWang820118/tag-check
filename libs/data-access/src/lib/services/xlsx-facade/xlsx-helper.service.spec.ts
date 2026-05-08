import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpecExtractService } from '../gtm-json-converter/extract/spec-extract.service';
import { XlsxHelper } from './xlsx-helper.service';

describe('XlsxHelper', () => {
  let helper: XlsxHelper;
  let specExtract: { fixJsonString: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    specExtract = { fixJsonString: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        XlsxHelper,
        { provide: SpecExtractService, useValue: specExtract }
      ]
    });
    helper = TestBed.inject(XlsxHelper);
  });

  describe('filterGtmSpecsFromData', () => {
    it('keeps rows that contain a window.dataLayer.push reference and drops the rest', () => {
      const data = [
        { col: 'window.dataLayer.push({event:"a"})' },
        { col: 'unrelated text' },
        { col: 'window.dataLayer.push({event:"b"})' }
      ];
      const filtered = helper.filterGtmSpecsFromData(data);
      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toEqual({
        col: 'window.dataLayer.push({event:"a"})'
      });
    });
  });

  describe('convertSpecStringToObject', () => {
    it('parses the dataLayer payload from a window.dataLayer.push call', () => {
      const result = helper.convertSpecStringToObject({
        col: 'window.dataLayer.push({"event":"view_item"})'
      });
      expect(result).toEqual({ event: 'view_item' });
    });

    it('falls back to fixJsonString when direct parsing fails', () => {
      specExtract.fixJsonString.mockReturnValue('{"event":"fixed"}');
      const result = helper.convertSpecStringToObject({ col: '{event:bad}' });
      expect(specExtract.fixJsonString).toHaveBeenCalledWith('{event:bad}');
      expect(result).toEqual({ event: 'fixed' });
    });

    it('returns null and records the input when fixJsonString also fails', () => {
      specExtract.fixJsonString.mockReturnValue('still-bad-json');
      const result = helper.convertSpecStringToObject({ col: '{event:bad}' });
      expect(result).toBeNull();
      expect(helper.unfixedableJsonString.has('{event:bad}')).toBe(true);
    });
  });

  describe('filterNonEmptyData', () => {
    it('drops trailing empty columns based on the deepest non-empty index', () => {
      const data = [
        { a: 'x', b: 'y', c: '', d: '' },
        { a: 'x', b: '', c: 'z', d: '' }
      ];
      const result = helper.filterNonEmptyData(data);
      // The deepest non-empty index across rows is 'c', so 'd' is dropped.
      expect(Object.keys(result[0])).toEqual(['a', 'b', 'c']);
      expect(Object.keys(result[1])).toEqual(['a', 'b', 'c']);
    });
  });
});
