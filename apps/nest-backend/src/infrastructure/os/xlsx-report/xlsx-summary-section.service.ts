import { Injectable } from '@nestjs/common';
import { getCheckStatus, RunStatus } from '@utils';
import { FullTestEventResponseDto } from '../../../shared';
import * as ExcelJS from 'exceljs';

/** The result cell's text and ARGB color, as the app labels each status. */
const RESULT_CELLS: Record<RunStatus, { text: string; argb: string }> = {
  passed: { text: 'PASSED', argb: '00008000' },
  partial: { text: 'PARTIAL', argb: '00FF8C00' },
  failed: { text: 'FAILED', argb: '00FF0000' },
  notRun: { text: 'NOT RUN', argb: '00808080' }
};

@Injectable()
export class XlsxSummarySectionService {
  addSummarySection(
    worksheet: ExcelJS.Worksheet,
    report: FullTestEventResponseDto
  ): void {
    // Add a few empty rows after the data
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Add summary section
    const summaryRow = worksheet.addRow(['Test Summary']);
    summaryRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${summaryRow.number}:G${summaryRow.number}`);

    // The latest run's result; the data rows above list every run.
    const latest = report.latestTestEventDetail;
    const result =
      RESULT_CELLS[
        latest ? getCheckStatus(latest.passed, latest.requestPassed) : 'notRun'
      ];
    const resultRow = worksheet.addRow(['Test Result:', result.text]);

    const resultCell = worksheet.getCell(`B${resultRow.number}`);
    resultCell.font = { bold: true, color: { argb: result.argb } };

    // Add any additional summary information
    if (report.message) {
      const messageRow = worksheet.addRow(['Message:', report.message]);
      worksheet.mergeCells(`B${messageRow.number}:G${messageRow.number}`);
    }
  }
}
