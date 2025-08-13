import { Injectable } from '@nestjs/common';
import { FullTestEventResponseDto } from '../../../shared';
import * as ExcelJS from 'exceljs';
import { XlsxUtilsService } from './xlsx-utils.service';

@Injectable()
export class XlsxRecordingSectionService {
  constructor(private readonly xlsxUtilsService: XlsxUtilsService) {}
  addRecordingSection(
    worksheet: ExcelJS.Worksheet,
    report: FullTestEventResponseDto
  ): void {
    // Add a few empty rows after the summary section
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Add recording section header
    const recordingHeaderRow = worksheet.addRow(['Recording']);
    recordingHeaderRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(
      `A${recordingHeaderRow.number}:B${recordingHeaderRow.number}`
    );

    // Check if recording data exists
    const recordingData = report.recording || '{}';

    // Format the JSON data for better readability
    const formattedRecording = this.xlsxUtilsService.formatJsonForExcel(
      typeof recordingData === 'string'
        ? this.tryParseJson(recordingData)
        : recordingData
    );

    // Add the recording data in a merged cell for better display
    const recordingRow = worksheet.addRow(['']);
    const recordingCell = worksheet.getCell(`A${recordingRow.number}`);
    recordingCell.value = formattedRecording;

    // Merge cells for the recording data to span across columns
    worksheet.mergeCells(`A${recordingRow.number}:B${recordingRow.number}`);

    // Style the recording cell
    recordingCell.alignment = {
      wrapText: true,
      vertical: 'top',
      horizontal: 'left'
    };

    // Add a border around the recording data
    recordingCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Set a reasonable height for the recording data cell
    recordingRow.height = 200; // Adjust based on expected content size
  }

  // Helper method to try parsing JSON strings
  private tryParseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return jsonString;
    }
  }
}
