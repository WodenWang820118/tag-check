import { TestBed } from '@angular/core/testing';
import { UploadSpecService } from './upload-spec.service';

describe('UploadSpecService', () => {
  let svc: UploadSpecService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(UploadSpecService);
  });

  it('initializes flags as false', () => {
    expect(svc.isStarted()).toBe(false);
    expect(svc.isUploaded()).toBe(false);
    expect(svc.isOpenImportSidenav()).toBe(false);
  });

  it('existKeys returns true when every spec has an event key', () => {
    expect(svc.existKeys([{ event: 'a' }, { event: 'b' }])).toBe(true);
  });

  it('existKeys returns false when any spec is missing the event key', () => {
    expect(svc.existKeys([{ event: 'a' }, {} as any])).toBe(false);
  });

  it('existKeys returns true for an empty list', () => {
    expect(svc.existKeys([])).toBe(true);
  });

  it('startUpload + completeUpload flips uploaded and resets started', () => {
    svc.startUpload();
    expect(svc.isStarted()).toBe(true);
    svc.completeUpload();
    expect(svc.isUploaded()).toBe(true);
    expect(svc.isStarted()).toBe(false);
  });

  it('openImportSidenav + resetImport toggle the sidenav signal', () => {
    svc.openImportSidenav();
    expect(svc.isOpenImportSidenav()).toBe(true);
    svc.resetImport();
    expect(svc.isOpenImportSidenav()).toBe(false);
  });

  it('resetStart turns isStarted off without affecting uploaded', () => {
    svc.startUpload();
    svc.resetStart();
    expect(svc.isStarted()).toBe(false);
    expect(svc.isUploaded()).toBe(false);
  });
});
