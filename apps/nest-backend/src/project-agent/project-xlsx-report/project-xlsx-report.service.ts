import { Injectable } from '@nestjs/common';
import { XlsxReportSingleEventService } from '../../os/xlsx-report/xlsx-report-single-event.service';
import { XlsxReportGroupEventsService } from '../../os/xlsx-report/xlsx-report-group-events.service';

@Injectable()
export class ProjectXlsxReportService {
  constructor(
    private xlsxReportService: XlsxReportSingleEventService,
    private xlsxReportGroupEventsService: XlsxReportGroupEventsService
  ) {}

  async writeXlsxFile(
    filename: string,
    sheetName: string,
    data: any[],
    eventId: string,
    projectName: string
  ) {
    return await this.xlsxReportService.writeXlsxFile(
      filename,
      sheetName,
      data,
      eventId,
      projectName
    );
  }

  async writeXlsxFileGroupEvents(
    operations: string[],
    fileName: string,
    sheetName: string,
    projectName: string
  ) {
    return await this.xlsxReportGroupEventsService.writeXlsxFileForAllTests(
      operations,
      fileName,
      sheetName,
      projectName
    );
  }
}
