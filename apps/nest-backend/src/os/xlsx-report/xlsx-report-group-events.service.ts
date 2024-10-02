/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { FilePathService } from '../path/file-path/file-path.service';
import { FileService } from '../file/file.service';
import { XlsxReportSingleEventService } from './xlsx-report-single-event.service';

@Injectable()
export class XlsxReportGroupEventsService {
  constructor(
    private readonly filePathService: FilePathService,
    private readonly fileService: FileService,
    private readonly xlsxReportSingleEventService: XlsxReportSingleEventService
  ) {}

  async writeXlsxFileForAllTests(
    operations: string[],
    fileName: string,
    sheetName: string,
    projectName: string
  ) {
    const data = [];
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const cachePath = await this.filePathService.getCacheFilePath(
        projectName,
        operation
      );
      const cache = this.fileService.readJsonFile<any>(cachePath);
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

    await this.xlsxReportSingleEventService.writeXlsxFile(
      fileName,
      sheetName,
      result,
      'all',
      projectName
    );
  }
}
