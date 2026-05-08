import { describe, expect, it } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxHeaderService } from './xlsx-header.service';

describe('XlsxHeaderService', () => {
  it('addProjectHeader() writes title, description, measurement id, and a spacer row', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');
    new XlsxHeaderService().addProjectHeader(
      ws,
      {
        projectName: 'Demo',
        projectSlug: 'demo',
        projectDescription: 'desc',
        measurementId: 'GTM-1'
      },
      {} as never
    );
    expect(ws.getRow(1).getCell(1).value).toContain('Project: Demo');
    expect(ws.getRow(2).getCell(1).value).toBe('Description:');
    expect(ws.getRow(2).getCell(2).value).toBe('desc');
    expect(ws.getRow(3).getCell(1).value).toBe('Measurement ID:');
    expect(ws.getRow(3).getCell(2).value).toBe('GTM-1');
  });
});
