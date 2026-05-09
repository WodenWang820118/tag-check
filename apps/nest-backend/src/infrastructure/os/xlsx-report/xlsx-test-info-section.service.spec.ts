import { describe, expect, it } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxTestInfoSectionService } from './xlsx-test-info-section.service';

describe('XlsxTestInfoSectionService', () => {
  it('writes the section header, test name, event name, and timestamp rows', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');
    new XlsxTestInfoSectionService().addTestInfoSection(ws, {
      testName: 'My Test',
      eventName: 'page_view',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z')
    } as never);
    expect(ws.getRow(1).getCell(1).value).toBe('Test Information');
    expect(ws.getRow(2).getCell(1).value).toBe('Test Name:');
    expect(ws.getRow(2).getCell(2).value).toBe('My Test');
    expect(ws.getRow(3).getCell(2).value).toBe('page_view');
    expect(ws.getRow(4).getCell(1).value).toBe('Created:');
    expect(ws.getRow(5).getCell(1).value).toBe('Updated:');
  });

  it('falls back to the placeholder strings when fields are missing', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');
    new XlsxTestInfoSectionService().addTestInfoSection(ws, {} as never);
    expect(ws.getRow(2).getCell(2).value).toBe('Unnamed Test');
    expect(ws.getRow(3).getCell(2).value).toBe('No Event');
    expect(ws.getRow(4).getCell(2).value).toBe('Unknown');
  });
});
