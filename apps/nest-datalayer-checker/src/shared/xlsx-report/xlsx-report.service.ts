import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class XlsxReportService {
  async writeXlsxFile(
    savingFolder: string,
    fileName: string,
    sheetName: string,
    data: any,
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
      const file = path.join(savingFolder, `${testName}.png`);
      const imageId = workbook.addImage({
        buffer: readFileSync(file),
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 2, row: 1 },
        ext: { width: 100, height: 50 },
      });
    } else if (projectName) {
      // all tests
      const dataContent = JSON.parse(JSON.stringify(data));
      Logger.log('dataContent: ', dataContent);
      for (let i = 0; i < dataContent.length; i++) {
        // get existing image after the test
        const eventName =
          dataContent[i]['dataLayerResult']['dataLayerSpec']['event'];

        const imagePath = path.join(savingFolder, `${eventName}.png`);
        const imageId = workbook.addImage({
          buffer: readFileSync(imagePath),
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: worksheet.columns.length, row: i + 1 },
          ext: { width: 100, height: 50 },
        });
      }
    }

    worksheet.addRows(data);
    await workbook.xlsx.writeFile(path.join(savingFolder, fileName));
  }
}
