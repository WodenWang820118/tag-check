import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkbookService } from './workbook.service';

describe('WorkbookService', () => {
  let service: WorkbookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkbookService);
  });

  it('exposes initial signal values', () => {
    expect(service.workbook$()).toBeNull();
    expect(service.worksheetNames$()).toEqual(['']);
    expect(service.fileName$()).toBe('');
  });

  it('stores workbook data, sheet names, and file name independently', () => {
    const workbook = { SheetNames: ['Sheet1'] };
    service.setWorkbook(workbook);
    service.setWorksheetNames(['Sheet1', 'Sheet2']);
    service.setFileName('events.xlsx');

    expect(service.workbook$()).toBe(workbook);
    expect(service.worksheetNames$()).toEqual(['Sheet1', 'Sheet2']);
    expect(service.fileName$()).toBe('events.xlsx');
  });

  it('handleReadXlsxAction applies workbook and sheet names from the payload', () => {
    const payload = {
      workbook: { SheetNames: ['A'] },
      sheetNames: ['A', 'B']
    };
    service.handleReadXlsxAction(payload);
    expect(service.workbook$()).toBe(payload.workbook);
    expect(service.worksheetNames$()).toEqual(['A', 'B']);
  });

  it('resetWorkbookData clears workbook, worksheet names, and file name', () => {
    service.setWorkbook({ x: 1 });
    service.setWorksheetNames(['Sheet1']);
    service.setFileName('a.xlsx');

    service.resetWorkbookData();

    expect(service.workbook$()).toBeNull();
    expect(service.worksheetNames$()).toEqual(['']);
    expect(service.fileName$()).toBe('');
  });

  it('resetFileName only clears the file name', () => {
    service.setWorkbook({ x: 1 });
    service.setFileName('a.xlsx');
    service.resetFileName();
    expect(service.fileName$()).toBe('');
    expect(service.workbook$()).toEqual({ x: 1 });
  });
});
