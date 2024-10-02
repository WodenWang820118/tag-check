/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as ExcelJS from 'exceljs';
import { FilePathService } from '../path/file-path/file-path.service';

@Injectable()
export class XlsxReportSingleEventService {
  private readonly logger = new Logger(XlsxReportSingleEventService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly filePathService: FilePathService
  ) {}
  async writeXlsxFile(
    fileName: string,
    sheetName: string,
    data:
      | {
          dataLayerResult: any;
          requestCheckResult: any;
          rawRequest: string;
          destinationUrl: string;
        }[]
      | {
          dataLayerResult: any;
          requestCheckResult: any;
          rawRequest: string;
          destinationUrl: string;
        },
    eventId: string,
    projectSlug: string
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    try {
      const eventSavingFolder =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventId
        );
      worksheet.columns = [
        { header: 'DataLayer Result', key: 'dataLayerResult', width: 50 },
        { header: 'Request Result', key: 'requestCheckResult', width: 50 },
        { header: 'Raw Request', key: 'rawRequest', width: 50 },
        { header: 'Destination URL', key: 'destinationUrl', width: 50 },
      ];
      // single test
      if (eventId) {
        await this.addImageToWorksheet(
          workbook,
          worksheet,
          projectSlug,
          eventId
        );
      } else if (projectSlug) {
        await this.addImagesForAllTests(
          workbook,
          worksheet,
          data,
          projectSlug,
          eventId
        );
      }
      const filePath = join(eventSavingFolder, fileName);
      if (Array.isArray(data)) {
        worksheet.addRows(data);
        await workbook.xlsx.writeFile(filePath);
      } else {
        worksheet.addRow(data);
      }
      await workbook.xlsx.writeFile(filePath);
    } catch (error) {
      this.handleError(error, 'writeXlsxFile');
    }
  }

  private async addImageToWorksheet(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    projectSlug: string,
    eventId: string
  ) {
    try {
      const file = await this.filePathService.getImageFilePath(
        projectSlug,
        eventId
      );
      const imageId = workbook.addImage({
        buffer: readFileSync(file),
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 2, row: 1 },
        ext: { width: 100, height: 50 },
      });
    } catch (error) {
      this.handleError(error, 'An error occurred while writing an image');
    }
  }

  private async addImagesForAllTests(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    data:
      | {
          dataLayerResult: any;
          requestCheckResult: any;
          rawRequest: string;
          destinationUrl: string;
        }[]
      | {
          dataLayerResult: any;
          requestCheckResult: any;
          rawRequest: string;
          destinationUrl: string;
        },
    projectSlug: string,
    eventId: string
  ) {
    const dataContent = Array.isArray(data) ? data : [data];
    for (let i = 0; i < dataContent.length; i++) {
      try {
        const file = await this.filePathService.getImageFilePath(
          projectSlug,
          eventId
        );
        const imageId = workbook.addImage({
          buffer: readFileSync(file),
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: worksheet.columns.length, row: i + 1 },
          ext: { width: 100, height: 50 },
        });
      } catch (error) {
        this.handleError(error, 'addImagesForAllTests');
      }
    }
  }

  private handleError(error: unknown, methodName: string) {
    this.logger.error(
      `Error in ${XlsxReportSingleEventService.name}.${methodName}: ${
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
