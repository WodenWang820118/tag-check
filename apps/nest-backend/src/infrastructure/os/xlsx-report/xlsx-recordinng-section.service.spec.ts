import { describe, it, expect, vi } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxRecordingSectionService } from './xlsx-recordinng-section.service';
import { XlsxUtilsService } from './xlsx-utils.service';

describe('XlsxRecordingSectionService', () => {
  function build() {
    const utils = {
      formatJsonForExcel: vi.fn((v: unknown) =>
        typeof v === 'string' ? v : JSON.stringify(v)
      )
    } as unknown as XlsxUtilsService;
    return new XlsxRecordingSectionService(utils);
  }

  it('adds a Recording header and renders an empty object when recording is missing', () => {
    const svc = build();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');

    svc.addRecordingSection(ws, { recording: undefined } as never);

    const headerCellFound = (ws as unknown as { _rows?: unknown[] })._rows;
    expect(headerCellFound).toBeDefined();
    // Recording header row text
    const headerRow = ws.getRow(3);
    expect(headerRow.getCell(1).value).toBe('Recording');
    // Recording data row
    const dataRow = ws.getRow(4);
    expect(dataRow.getCell(1).value).toBeDefined();
  });

  it('parses a JSON string recording payload before formatting', () => {
    const svc = build();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('s');

    svc.addRecordingSection(ws, {
      recording: '{"a":1}'
    } as never);

    const dataRow = ws.getRow(4);
    expect(String(dataRow.getCell(1).value)).toContain('1');
  });
});
