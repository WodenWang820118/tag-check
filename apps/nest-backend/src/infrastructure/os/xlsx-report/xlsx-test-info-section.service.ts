import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../shared';

@Injectable()
export class XlsxTestInfoSectionService {
  // no constructor needed

  addTestInfoSection(
    worksheet: ExcelJS.Worksheet,
    report: FullTestEventResponseDto
  ): void {
    // Add test section header
    const testHeaderRow = worksheet.addRow(['Test Information']);
    testHeaderRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${testHeaderRow.number}:G${testHeaderRow.number}`);

    // Add test details
    worksheet.addRow(['Test Name:', report.testName || 'Unnamed Test']);
    worksheet.addRow(['Event Name:', report.eventName || 'No Event']);

    // Add timestamps
    const createdTime = report.createdAt
      ? new Date(report.createdAt).toLocaleString()
      : 'Unknown';
    const updatedTime = report.updatedAt
      ? new Date(report.updatedAt).toLocaleString()
      : 'Unknown';

    worksheet.addRow(['Created:', createdTime]);
    worksheet.addRow(['Updated:', updatedTime]);

    // Add empty row for spacing
    worksheet.addRow([]);
  }
}
