import { describe, expect, it } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxSummarySectionService } from './xlsx-summary-section.service';

describe('XlsxSummarySectionService', () => {
  it('renders PASSED in green when testEventDetails.passed is true', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');
    new XlsxSummarySectionService().addSummarySection(
      ws,
      { testEventDetails: { passed: true } } as never,
      0
    );
    // Title row + result row layout: 2 spacer rows + summary header + result row
    const summaryHeader = ws.getRow(3).getCell(1).value;
    expect(summaryHeader).toBe('Test Summary');
    expect(ws.getRow(4).getCell(2).value).toBe('PASSED');
  });

  it('renders FAILED when testEventDetails.passed is false or missing, and adds a message row when present', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');
    new XlsxSummarySectionService().addSummarySection(
      ws,
      { message: 'something went wrong' } as never,
      0
    );
    expect(ws.getRow(4).getCell(2).value).toBe('FAILED');
    expect(ws.getRow(5).getCell(1).value).toBe('Message:');
    expect(ws.getRow(5).getCell(2).value).toBe('something went wrong');
  });
});
