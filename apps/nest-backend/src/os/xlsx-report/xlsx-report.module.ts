import { Module } from '@nestjs/common';
import { XlsxReportGroupEventsService } from './xlsx-report-group-events.service';
import { FileModule } from '../file/file.module';
import { FileService } from '../file/file.service';
import { XlsxReportSingleEventService } from './xlsx-report-single-event.service';

@Module({
  imports: [FileModule],
  providers: [
    XlsxReportGroupEventsService,
    XlsxReportSingleEventService,
    FileService,
  ],
  exports: [XlsxReportGroupEventsService, XlsxReportSingleEventService],
})
export class XlsxReportModule {}
