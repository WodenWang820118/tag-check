import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../shared';
import { XlsxUtilsService } from './xlsx-utils.service';

@Injectable()
export class XlsxTestDataSectionService {
  constructor(private xlsxUtilsService: XlsxUtilsService) {}

  addTestDataSection(
    worksheet: ExcelJS.Worksheet,
    report: FullTestEventResponseDto,
    startRow: number
  ): void {
    // Add data section header
    const dataHeaderRow = worksheet.addRow(['Test Data']);
    dataHeaderRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${dataHeaderRow.number}:G${dataHeaderRow.number}`);

    worksheet.columns = [
      { header: 'DataLayer Spec', key: 'dataLayerSpec', width: 40 },
      { header: 'DataLayer', key: 'dataLayer', width: 40 },
      { header: 'Passed', key: 'passed', width: 10 },
      { header: 'Request Passed', key: 'requestPassed', width: 10 },
      { header: 'Raw Request', key: 'rawRequest', width: 40 },
      { header: 'Reformed DataLayer', key: 'reformedDataLayer', width: 40 },
      { header: 'Destination URL', key: 'destinationUrl', width: 40 }
    ];

    // worksheet.getRow(dataHeaderRow.number + 1)

    // Add column headers for test data
    worksheet.addRow([
      'DataLayer Spec',
      'DataLayer',
      'Passed',
      'Request Passed',
      'Raw Request',
      'Reformed DataLayer',
      'Destination URL'
    ]);

    // Style the header row
    worksheet.getRow(dataHeaderRow.number + 1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' } // Light gray background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Prepare data row
    const rowData = [
      this.xlsxUtilsService.formatJsonForExcel(report.spec.dataLayerSpec || {}),
      this.xlsxUtilsService.formatJsonForExcel(
        report.testEventDetails?.dataLayer || {}
      ),
      report.testEventDetails?.passed || false,
      report.testEventDetails?.requestPassed || false,
      report.testEventDetails?.rawRequest || '',
      this.xlsxUtilsService.formatJsonForExcel(
        report.testEventDetails?.reformedDataLayer || {}
      ),
      report.testEventDetails?.destinationUrl || ''
    ];

    // Add the data row
    const dataRow = worksheet.addRow(rowData);

    // Style the data row
    dataRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Add special formatting for boolean values
      if (colNumber === 3 || colNumber === 4) {
        // Passed and Request Passed columns
        const value = cell.value as boolean;
        cell.font = {
          color: { argb: value ? '00008000' : '00FF0000' } // Green for true, red for false
        };
      }

      // Add word wrap for JSON and long text
      if (
        colNumber === 1 ||
        colNumber === 2 ||
        colNumber === 5 ||
        colNumber === 6
      ) {
        cell.alignment = { wrapText: true };
      }
    });

    // Adjust row height for better readability
    dataRow.height = 100;
  }
}
