import { HttpException, Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class XlsxReportService {
  async writeXlsxFile(
    savingFolder: string,
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
    testName?: string,
    projectName?: string
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = [
      { header: 'DataLayer Result', key: 'dataLayerResult', width: 50 },
      { header: 'Request Result', key: 'requestCheckResult', width: 50 },
      { header: 'Raw Request', key: 'rawRequest', width: 50 },
      { header: 'Destination URL', key: 'destinationUrl', width: 50 },
    ];
    // single test
    if (testName) {
      try {
        const eventSavingFolder = path.join(savingFolder, testName);
        const file = path.join(eventSavingFolder, `${testName}.png`);
        const imageId = workbook.addImage({
          buffer: readFileSync(file),
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 2, row: 1 },
          ext: { width: 100, height: 50 },
        });
      } catch (error) {
        Logger.error(error.message, 'XlsxReportService.writeXlsxFile');
        throw new HttpException(
          `An error occurred while writing the image: ${error}`,
          500
        );
      }
    } else if (projectName) {
      // all tests
      const dataContent = JSON.parse(JSON.stringify(data));
      for (let i = 0; i < dataContent.length; i++) {
        // get existing image after the test
        try {
          const eventName =
            dataContent[i]['dataLayerResult']['dataLayerSpec']['event'];
          const eventSavingFolder = path.join(savingFolder, eventName);
          const imagePath = path.join(eventSavingFolder, `${eventName}.png`);
          const imageId = workbook.addImage({
            buffer: readFileSync(imagePath),
            extension: 'png',
          });
          worksheet.addImage(imageId, {
            tl: { col: worksheet.columns.length, row: i + 1 },
            ext: { width: 100, height: 50 },
          });
        } catch (error) {
          // if throwing the error, other pieces of data will not be written to the xlsx file
          Logger.error(error.message, 'XlsxReportService.writeXlsxFile');
        }
      }
    }

    Logger.log(data, 'XlsxReportService.writeXlsxFile');
    try {
      const filePath = path.join(savingFolder, fileName);
      if (Array.isArray(data)) {
        worksheet.addRows(data);
        await workbook.xlsx.writeFile(filePath);
      } else {
        worksheet.addRow(data);
      }
      await workbook.xlsx.writeFile(filePath);
    } catch (error) {
      Logger.error(error.message, 'XlsxReportService.writeXlsxFile');
    }
  }

  async writeXlsxFileForAllTests(
    savingFolder: string,
    operations: string[],
    fileName: string,
    sheetName: string,
    projectName: string
  ) {
    const data = [];
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const cachePath = path.join(
        savingFolder,
        operation.replace('.json', ''),
        `${operation.replace('.json', '')} - result cache.json`
      );
      const cache = JSON.parse(readFileSync(cachePath).toString());
      data.push(cache);
    }

    const result = data.map((item) => {
      return {
        dataLayerResult: item.dataLayerCheckResult,
        requestCheckResult: item.requestCheckResult,
        rawRequest: item.rawRequest,
        destinationUrl: item.destinationUrl,
      };
    });

    await this.writeXlsxFile(
      savingFolder,
      fileName,
      sheetName,
      result,
      undefined,
      projectName
    );
  }
}
