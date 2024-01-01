import { Module } from '@nestjs/common';
import { XlsxReportService } from './xlsx-report.service';
import { PathModule } from '../path/path.module';
import { FileModule } from '../file/file.module';
import { FileService } from '../file/file.service';
@Module({
  imports: [PathModule, FileModule],
  providers: [XlsxReportService, FileService],
  exports: [XlsxReportService],
})
export class XlsxReportModule {}
