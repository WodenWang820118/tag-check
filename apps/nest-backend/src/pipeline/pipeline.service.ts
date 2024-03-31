import { XlsxReportSingleEventService } from './../os/xlsx-report/xlsx-report-single-event.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { getCurrentTimestamp } from '../waiter/utils';
import { InspectEventDto } from '../dto/inspect-event.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { AbstractDatalayerReportService } from '../os/abstract-datalayer-report/abstract-datalayer-report.service';
@Injectable()
export class PipelineService {
  constructor(
    private inspectorSingleEventService: InspectorSingleEventService,
    private xlsxReportSingleEventService: XlsxReportSingleEventService,
    private abstractDatalayerReportService: AbstractDatalayerReportService
  ) {}

  async singleEventInspectionRecipe(
    page: Page,
    projectName: string,
    testName: string,
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials,
    inspectEventDto?: InspectEventDto
  ) {
    try {
      const result = await this.inspectorSingleEventService.inspectDataLayer(
        page,
        projectName,
        testName,
        headless,
        path,
        measurementId,
        credentials,
        (inspectEventDto as any).inspectEventDto.application
      );

      Logger.log('DataLayer inspected', 'waiter.inspectSingleEvent');

      const data = [
        {
          dataLayerResult: result.dataLayerResult,
          rawRequest: result.rawRequest,
          requestCheckResult: result.requestCheckResult,
          destinationUrl: result.destinationUrl,
        },
      ];

      Logger.log('Data constructed', 'waiter.inspectSingleEvent');

      const timestamp = getCurrentTimestamp();
      await this.xlsxReportSingleEventService.writeXlsxFile(
        `QA_report_single_${testName}_${timestamp}.xlsx`,
        'Sheet1',
        data,
        testName,
        projectName
      );

      await this.abstractDatalayerReportService.writeSingleAbstractTestResultJson(
        projectName,
        testName,
        data[0].dataLayerResult
      );
      return data;
    } catch (error) {
      Logger.log(error.message, 'PipelineService.singleEventInspectionRecipe');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
