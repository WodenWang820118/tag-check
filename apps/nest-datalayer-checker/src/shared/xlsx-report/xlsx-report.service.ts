import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class XlsxReportService {
  writeXlsxFile(
    file: string,
    sheetName: string,
    data: any,
    testName?: string,
    projectName?: string
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = [
      { header: 'dataLayerResult', key: 'dataLayerResult', width: 50 },
      { header: 'requestCheckResult', key: 'requestCheckResult', width: 50 },
    ];
    // single test
    if (testName) {
      //TODO: result.xlsx could be different naming
      const imageId = workbook.addImage({
        buffer: readFileSync(file.replace('result.xlsx', `${testName}.png`)),
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 2, row: 1 },
        ext: { width: 100, height: 50 },
      });
    } else if (projectName) {
      // all tests
      const folderPath = path.join(file.split('result.xlsx')[0]);

      const obj = JSON.parse(JSON.stringify(data));
      for (let i = 0; i < obj.length; i++) {
        console.log('data[i]: ' + obj[i]);
        console.log(JSON.parse(obj[i]['dataLayerResult']));
        const imageId = workbook.addImage({
          buffer: readFileSync(
            `${folderPath}\\${
              JSON.parse(obj[i]['dataLayerResult']).dataLayerSpec.event
            }.png`
          ),
          extension: 'png',
        });

        worksheet.addImage(imageId, {
          tl: { col: 2, row: i + 1 },
          ext: { width: 100, height: 50 },
        });
      }
    }

    worksheet.addRows(data);
    workbook.xlsx.writeFile(file);
  }
}