import { Module } from '@nestjs/common';
import { XlsxReportService } from './xlsx-report.service';
import { XlsxHeaderService } from './xlsx-header.service';
import { XlsxTestInfoSectionService } from './xlsx-test-info-section.service';
import { XlsxTestDataSectionService } from './xlsx-test-data-section.service';
import { XlsxSummarySectionService } from './xlsx-summary-section.service';
import { XlsxRecordingSectionService } from './xlsx-recordinng-section.service';
import { XlsxUtilsService } from './xlsx-utils.service';
import { XlsxReportGroupingService } from './services/xlsx-report-grouping.service';
import { XlsxNameService } from './services/xlsx-name.service';
import { XlsxImageService } from './services/xlsx-image.service';

const services = [
  XlsxReportService,
  XlsxHeaderService,
  XlsxTestInfoSectionService,
  XlsxTestDataSectionService,
  XlsxSummarySectionService,
  XlsxRecordingSectionService,
  XlsxUtilsService,
  XlsxReportGroupingService,
  XlsxNameService,
  XlsxImageService
];

@Module({
  providers: [...services],
  exports: [...services]
})
export class XlsxReportModule {}
