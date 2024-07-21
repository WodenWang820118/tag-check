import { XlsxReportSingleEventService } from '../os/xlsx-report/xlsx-report-single-event.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import {
  OutputValidationResult,
  extractEventNameFromId,
  getCurrentTimestamp,
} from '@utils';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { AbstractReportService } from '../os/abstract-report/abstract-report.service';
@Injectable()
export class EventInspectionPipelineService {
  constructor(
    private inspectorSingleEventService: InspectorSingleEventService,
    private xlsxReportSingleEventService: XlsxReportSingleEventService,
    private abstractReportService: AbstractReportService
  ) {}

  async singleEventInspectionRecipe(
    page: Page,
    projectName: string,
    eventId: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    try {
      const result = await this.inspectorSingleEventService.inspectDataLayer(
        page,
        projectName,
        eventId,
        headless,
        measurementId,
        credentials,
        eventInspectionPresetDto.application
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
        `QA_report_single_${eventId}_${timestamp}.xlsx`,
        'Sheet1',
        data,
        eventId,
        projectName
      );

      const eventName = extractEventNameFromId(eventId);

      const outputValidationResult: OutputValidationResult = {
        eventName: eventName,
        passed: result.dataLayerResult.passed,
        requestPassed: result.requestCheckResult.passed,
        rawRequest: result.rawRequest,
        message: result.dataLayerResult.message,
        incorrectInfo: result.dataLayerResult.incorrectInfo,
        reformedDataLayer: result.requestCheckResult.dataLayer,
        dataLayer: result.dataLayerResult.dataLayer,
        dataLayerSpec: result.dataLayerResult.dataLayerSpec,
        destinationUrl: result.destinationUrl,
        completedTime: new Date(),
      };

      await this.abstractReportService.writeSingleAbstractTestResultJson(
        projectName,
        eventId,
        outputValidationResult
      );

      await page.close();
      return data;
    } catch (error) {
      Logger.error(
        error.message,
        'PipelineService.singleEventInspectionRecipe'
      );
      // throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
