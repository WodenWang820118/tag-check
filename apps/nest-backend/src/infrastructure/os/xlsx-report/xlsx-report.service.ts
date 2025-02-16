import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../shared';

@Injectable()
export class XlsxReportService {
  private readonly logger = new Logger(XlsxReportService.name);

  async writeXlsxFile(reports: FullTestEventResponseDto[]) {
    try {
      const workbook = new ExcelJS.Workbook();

      for (const report of reports) {
        const worksheetName = report.testName;
        const worksheet = workbook.addWorksheet(worksheetName);

        // Set columns as needed
        const columnDefinitions: Partial<ExcelJS.Column>[] = [
          { header: 'DataLayer Spec', key: 'dataLayerSpec', width: 25 },
          { header: 'DataLayer', key: 'dataLayer', width: 25 },
          { header: 'Passed', key: 'passed', width: 10 },
          { header: 'Request Passed', key: 'requestPassed', width: 10 },
          { header: 'Raw Request', key: 'rawRequest', width: 25 },
          { header: 'Reformed DataLayer', key: 'reformedDataLayer', width: 25 },
          { header: 'Destination URL', key: 'destinationUrl', width: 25 }
        ];

        worksheet.columns = columnDefinitions;

        const imageBuffer = Buffer.from(report.testImage.imageData);
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: 'png'
        });

        worksheet.addImage(imageId, {
          tl: { col: 2, row: 1 },
          ext: { width: 100, height: 50 }
        });

        // Add rows
        const rowData = {
          dataLayerSpec: JSON.stringify(report.spec?.dataLayerSpec || {}),
          dataLayer: JSON.stringify(report.testEventDetails?.dataLayer || {}),
          passed: report.testEventDetails?.passed || false,
          requestPassed: report.testEventDetails?.requestPassed || false,
          rawRequest: report.testEventDetails?.rawRequest || '',
          reformedDataLayer: JSON.stringify(
            report.testEventDetails?.reformedDataLayer || {}
          ),
          destinationUrl: report.testEventDetails?.destinationUrl || ''
        };

        worksheet.addRow(rowData);
      }

      const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
      // throw new Error('Not implemented');

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="report.xlsx"`
      });
    } catch (error) {
      this.handleError(error, 'writeXlsxFile');
      throw new HttpException(
        'An error occurred while processing the Excel file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private handleError(error: unknown, methodName: string) {
    this.logger.error(
      `Error in ${XlsxReportService.name}.${methodName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error.stack : undefined
    );

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(
      'An error occurred while processing the Excel file',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
