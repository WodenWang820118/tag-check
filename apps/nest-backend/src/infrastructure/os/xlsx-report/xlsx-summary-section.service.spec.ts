import { describe, expect, it } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxSummarySectionService } from './xlsx-summary-section.service';

describe('XlsxSummarySectionService', () => {
  function resultOf(report: object) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');
    new XlsxSummarySectionService().addSummarySection(ws, report as never);
    return ws;
  }

  it('renders PASSED in green when both checks of the latest run passed', () => {
    // The export loads every run as an array; the latest one decides.
    const ws = resultOf({
      testEventDetails: [
        { id: 1, passed: false, requestPassed: false },
        { id: 2, passed: true, requestPassed: true }
      ],
      latestTestEventDetail: { id: 2, passed: true, requestPassed: true }
    });
    // 2 spacer rows, the summary header, then the result row
    expect(ws.getRow(3).getCell(1).value).toBe('Test Summary');
    expect(ws.getRow(4).getCell(2).value).toBe('PASSED');
    expect(ws.getRow(4).getCell(2).font?.color?.argb).toBe('00008000');
  });

  it('renders PARTIAL when only one check of the latest run passed', () => {
    const ws = resultOf({
      latestTestEventDetail: { id: 2, passed: true, requestPassed: false }
    });
    expect(ws.getRow(4).getCell(2).value).toBe('PARTIAL');
  });

  it('renders FAILED when neither check passed, and adds a message row when present', () => {
    const ws = resultOf({
      latestTestEventDetail: { id: 2, passed: false, requestPassed: false },
      message: 'something went wrong'
    });
    expect(ws.getRow(4).getCell(2).value).toBe('FAILED');
    expect(ws.getRow(5).getCell(1).value).toBe('Message:');
    expect(ws.getRow(5).getCell(2).value).toBe('something went wrong');
  });

  it('renders NOT RUN when the test has no run', () => {
    const ws = resultOf({});
    expect(ws.getRow(4).getCell(2).value).toBe('NOT RUN');
  });
});
