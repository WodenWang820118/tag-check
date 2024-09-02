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
  constructor(
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}
  async writeXlsxFile(
    fileName: string,
    sheetName: string,
    data:
      | {
          dataLayerResult: any;
          requestCheckResult: any;
          rawRequest: any;
          destinationUrl: any;
        }[]
      | {
          dataLayerResult: any;
          requestCheckResult: any;
          rawRequest: any;
          destinationUrl: any;
        },
    eventId: string,
    projectSlug: string
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);
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
          Logger.error(
            error,
            `${XlsxReportSingleEventService.name}.${XlsxReportSingleEventService.prototype.writeXlsxFile.name}`
          );
          throw new HttpException(
            `An error occurred while writing an image: ${error}`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      } else if (projectSlug) {
        // all tests
        const dataContent = JSON.parse(JSON.stringify(data));
        for (let i = 0; i < dataContent.length; i++) {
          // get existing image after the test
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
            if (error instanceof HttpException) {
              Logger.error(
                error,
                `${XlsxReportSingleEventService.name}.${XlsxReportSingleEventService.prototype.writeXlsxFile.name}`
              );
              throw error;
            }

            Logger.error(
              error,
              `${XlsxReportSingleEventService.name}.${XlsxReportSingleEventService.prototype.writeXlsxFile.name}`
            );
            throw new HttpException(
              String(error),
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }
        }
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
      Logger.error(
        error,
        `${XlsxReportSingleEventService.name}.${XlsxReportSingleEventService.prototype.writeXlsxFile.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
