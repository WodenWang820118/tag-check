import { XlsxReportSingleEventService } from './../os/xlsx-report/xlsx-report-single-event.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { getCurrentTimestamp } from '../waiter/utils';
import { InspectEventDto } from '../dto/inspect-event.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { AbstractDatalayerReportService } from '../os/abstract-datalayer-report/abstract-datalayer-report.service';
import { OutputValidationResult } from '../interfaces/dataLayer.interface';
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
        measurementId,
        credentials,
        inspectEventDto.application
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

      const outputValidationResult: OutputValidationResult = {
        passed: result.dataLayerResult.passed,
        requestPassed: result.requestCheckResult.passed,
        rawRequest: result.rawRequest,
        message: result.dataLayerResult.message,
        incorrectInfo: result.dataLayerResult.incorrectInfo,
        reformedDataLayer: result.requestCheckResult.dataLayer,
        dataLayer: result.dataLayerResult.dataLayer,
        dataLayerSpec: result.dataLayerResult.dataLayerSpec,
        destinationUrl: result.destinationUrl,
      };

      await this.abstractDatalayerReportService.writeSingleAbstractTestResultJson(
        projectName,
        testName,
        outputValidationResult
      );
      return data;
    } catch (error) {
      Logger.log(error.message, 'PipelineService.singleEventInspectionRecipe');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
