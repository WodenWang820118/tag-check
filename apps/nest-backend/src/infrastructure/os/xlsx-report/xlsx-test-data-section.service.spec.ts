import { describe, it, expect, vi } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxTestDataSectionService } from './xlsx-test-data-section.service';
import { XlsxUtilsService } from './xlsx-utils.service';

describe('XlsxTestDataSectionService', () => {
  function build() {
    const utils = {
      formatJsonForExcel: vi.fn((v: unknown) =>
        typeof v === 'string' ? v : JSON.stringify(v ?? null)
      )
    } as unknown as XlsxUtilsService;
    return new XlsxTestDataSectionService(utils);
  }

  it('adds a Test Data header row and one data row per detail entry', () => {
    const svc = build();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');

    const report = {
      spec: { dataLayerSpec: { event: 'click' } },
      testEventDetails: [
        {
          dataLayer: { x: 1 },
          passed: true,
          requestPassed: true,
          rawRequest: 'r1',
          destinationUrl: 'u1'
        },
        {
          dataLayer: { y: 2 },
          passed: false,
          requestPassed: false,
          rawRequest: 'r2',
          destinationUrl: 'u2'
        }
      ]
    } as never;

    svc.addTestDataSection(ws, report, 1);

    // Two data rows are written; assert by scanning row values instead of relying on
    // exact row numbers since worksheet.columns assignment shifts the header.
    const allValues: unknown[] = [];
    ws.eachRow((row) => {
      row.eachCell((cell) => allValues.push(cell.value));
    });
    expect(allValues).toContain('r1');
    expect(allValues).toContain('r2');
    expect(allValues).toContain('u1');
    expect(allValues).toContain('u2');
    expect(allValues).toContain(true);
    expect(allValues).toContain(false);
  });

  it('normalises a single object testEventDetails into a one-row write', () => {
    const svc = build();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');

    const report = {
      spec: { dataLayerSpec: { event: 'view' } },
      testEventDetails: {
        dataLayer: {},
        passed: true,
        requestPassed: false,
        rawRequest: 'rr',
        destinationUrl: 'du'
      }
    } as never;

    svc.addTestDataSection(ws, report, 1);

    const allValues: unknown[] = [];
    ws.eachRow((row) => {
      row.eachCell((cell) => allValues.push(cell.value));
    });
    expect(allValues).toContain('rr');
    expect(allValues).toContain('du');
  });
});
