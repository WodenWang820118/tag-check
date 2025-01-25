import { Module } from '@nestjs/common';
import { XlsxReportService } from './xlsx-report.service';

@Module({
  providers: [XlsxReportService],
  exports: [XlsxReportService]
})
export class XlsxReportModule {}
