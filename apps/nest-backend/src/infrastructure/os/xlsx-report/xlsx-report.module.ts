import { Module } from '@nestjs/common';
import { XlsxReportService } from './xlsx-report.service';
import { XlsxHeaderService } from './xlsx-header.service';
import { XlsxTestInfoSectionService } from './xlsx-test-info-section.service';
import { XlsxTestDataSectionService } from './xlsx-test-data-section.service';
import { XlsxSummarySectionService } from './xlsx-summary-section.service';
import { XlsxRecordingSectionService } from './xlsx-recordinng-section.service';
import { XlsxUtilsService } from './xlsx-utils.service';

const services = [
  XlsxReportService,
  XlsxHeaderService,
  XlsxTestInfoSectionService,
  XlsxTestDataSectionService,
  XlsxSummarySectionService,
  XlsxRecordingSectionService,
  XlsxUtilsService
];

@Module({
  providers: [...services],
  exports: [...services]
})
export class XlsxReportModule {}
