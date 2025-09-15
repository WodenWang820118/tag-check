import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../shared';
import { XlsxUtilsService } from './xlsx-utils.service';

@Injectable()
export class XlsxTestDataSectionService {
  private readonly logger = new Logger(XlsxTestDataSectionService.name);
  constructor(private readonly xlsxUtilsService: XlsxUtilsService) {}

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

    this.logger.log(
      'report before adding test data section: ' +
        JSON.stringify(report.testEventDetails, null, 2)
    );

    // Normalize testEventDetails to an array to support both single object and array payloads
    const detailsArray: any[] = Array.isArray((report as any).testEventDetails)
      ? ((report as any).testEventDetails as any[])
      : [(report as any).testEventDetails];

    // Add one data row per detail entry
    detailsArray.forEach((detail, index) => {
      const rowData = [
        this.xlsxUtilsService.formatJsonForExcel(report.spec.dataLayerSpec),
        this.xlsxUtilsService.formatJsonForExcel(detail?.dataLayer),
        // Keep booleans as booleans so conditional formatting works correctly
        detail?.passed === true,
        detail?.requestPassed === true,
        detail?.rawRequest ?? '',
        detail?.destinationUrl ?? ''
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

        // Add special formatting for boolean values (Passed and Request Passed)
        if (colNumber === 3 || colNumber === 4) {
          const isTrue = cell.value === true || cell.value === 'true';
          cell.font = {
            color: { argb: isTrue ? '00008000' : '00FF0000' } // Green for true, red for false
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
    });
  }
}
