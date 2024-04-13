import { TestBed } from '@angular/core/testing';

import { XlsxProcessService } from './xlsx-process.service';

describe('XlsxProcessService', () => {
  let service: XlsxProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XlsxProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
