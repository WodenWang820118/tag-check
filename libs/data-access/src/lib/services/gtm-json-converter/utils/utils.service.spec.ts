import { TestBed } from '@angular/core/testing';
import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  let svc: UtilsService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(UtilsService);
  });

  describe('extractAccountAndContainerId', () => {
    it('parses ids from a GTM url', () => {
      expect(
        svc.extractAccountAndContainerId(
          'https://tagmanager.google.com/#/container/accounts/123/containers/456/workspaces/7'
        )
      ).toEqual({ accountId: '123', containerId: '456' });
    });

    it('returns empty strings when the url has no ids', () => {
      expect(svc.extractAccountAndContainerId('https://example.com')).toEqual({
        accountId: '',
        containerId: ''
      });
    });
  });

  describe('outputTime', () => {
    it('formats the current date as YYYY-MM-DD HH:mm:ss', () => {
      expect(svc.outputTime()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getAllObjectPaths', () => {
    it('returns dotted paths for nested object', () => {
      const paths = svc.getAllObjectPaths({
        a: 1,
        b: { c: 2, d: { e: 3 } }
      } as never);
      expect(paths).toEqual(['a', 'b', 'b.c', 'b.d', 'b.d.e']);
    });

    it('returns an empty array for an empty object', () => {
      expect(svc.getAllObjectPaths({} as never)).toEqual([]);
    });

    it('does not recurse into null leaves', () => {
      expect(svc.getAllObjectPaths({ a: null } as never)).toEqual(['a']);
    });
  });
});
