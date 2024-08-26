import { ProjectXlsxReportService } from './../project-agent/project-xlsx-report/project-xlsx-report.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import {
  OutputValidationResult,
  extractEventNameFromId,
  getCurrentTimestamp,
} from '@utils';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { ProjectAbstractReportService } from '../project-agent/project-abstract-report/project-abstract-report.service';
@Injectable()
export class EventInspectionPipelineService {
  constructor(
    private inspectorSingleEventService: InspectorSingleEventService,
    private projectXlsxReportService: ProjectXlsxReportService,
    private projectAbstractReportService: ProjectAbstractReportService
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

      Logger.log(
        'DataLayer inspected',
        `${EventInspectionPipelineService.name}.${EventInspectionPipelineService.prototype.singleEventInspectionRecipe.name}`
      );

      const data = [
        {
          dataLayerResult: result.dataLayerResult,
          rawRequest: result.rawRequest,
          requestCheckResult: result.requestCheckResult,
          destinationUrl: result.destinationUrl,
        },
      ];

      Logger.log(
        `Data constructed: ${data}`,
        `${EventInspectionPipelineService.name}.${EventInspectionPipelineService.prototype.singleEventInspectionRecipe.name}`
      );

      const timestamp = getCurrentTimestamp();
      const eventName = extractEventNameFromId(eventId);
      const dataLayerPassed = result.dataLayerResult.passed;
      const requestPassed = result.requestCheckResult.passed;

      await this.projectXlsxReportService.writeXlsxFile(
        `${eventName}_${dataLayerPassed}_${requestPassed}_${timestamp}.xlsx`,
        'Sheet1',
        data,
        eventId,
        projectName
      );

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

      await this.projectAbstractReportService.writeSingleAbstractTestResultJson(
        projectName,
        eventId,
        outputValidationResult
      );
      return data;
    } catch (error) {
      Logger.error(
        error,
        `${EventInspectionPipelineService}.${EventInspectionPipelineService.prototype.singleEventInspectionRecipe.name}`
      );
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
