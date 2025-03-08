import { Injectable } from '@nestjs/common';
import { FullTestEventResponseDto } from '../../../shared';
import * as ExcelJS from 'exceljs';

@Injectable()
export class XlsxSummarySectionService {
  addSummarySection(
    worksheet: ExcelJS.Worksheet,
    report: FullTestEventResponseDto,
    startRow: number
  ): void {
    // Add a few empty rows after the data
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Add summary section
    const summaryRow = worksheet.addRow(['Test Summary']);
    summaryRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${summaryRow.number}:G${summaryRow.number}`);

    // Add test result
    const passed = report.testEventDetails?.passed || false;
    const resultRow = worksheet.addRow([
      'Test Result:',
      passed ? 'PASSED' : 'FAILED'
    ]);

    // Style the result cell
    const resultCell = worksheet.getCell(`B${resultRow.number}`);
    resultCell.font = {
      bold: true,
      color: { argb: passed ? '00008000' : '00FF0000' } // Green for passed, red for failed
    };

    // Add any additional summary information
    if (report.message) {
      const messageRow = worksheet.addRow(['Message:', report.message]);
      worksheet.mergeCells(`B${messageRow.number}:G${messageRow.number}`);
    }
  }
}
