import { Module } from '@nestjs/common';
import { XlsxReportGroupEventsService } from './xlsx-report-group-events.service';
import { PathModule } from '../path/path.module';
import { FileModule } from '../file/file.module';
import { FileService } from '../file/file.service';
import { XlsxReportSingleEventService } from './xlsx-report-single-event.service';

const services = [
  XlsxReportGroupEventsService,
  XlsxReportSingleEventService,
  FileService,
];
@Module({
  imports: [PathModule, FileModule],
  providers: [...services],
  exports: [...services],
})
export class XlsxReportModule {}
