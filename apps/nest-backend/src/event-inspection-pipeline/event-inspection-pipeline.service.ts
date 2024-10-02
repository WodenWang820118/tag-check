/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { ProjectXlsxReportService } from './../project-agent/project-xlsx-report/project-xlsx-report.service';
import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import {
  OutputValidationResult,
  ValidationResult,
  extractEventNameFromId,
} from '@utils';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { ProjectAbstractReportService } from '../project-agent/project-abstract-report/project-abstract-report.service';
@Injectable()
export class EventInspectionPipelineService {
  private readonly logger = new Logger(EventInspectionPipelineService.name);
  constructor(
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly projectXlsxReportService: ProjectXlsxReportService,
    private readonly projectAbstractReportService: ProjectAbstractReportService
  ) {}

  async singleEventInspectionRecipe(
    page: Page,
    projectSlug: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    try {
      const result = await this.inspectDataLayer(
        page,
        projectSlug,
        eventId,
        headless,
        measurementId,
        credentials,
        captureRequest,
        eventInspectionPresetDto
      );

      const data = this.prepareData(result);
      const timestamp = new Date().getTime();
      const eventName = extractEventNameFromId(eventId);
      const dataLayerPassed = result.dataLayerResult.passed;
      const requestPassed = result.requestCheckResult.passed;

      await this.writeAbstractReport(result, projectSlug, eventId);
      await this.projectXlsxReportService.writeXlsxFile(
        `${eventName} ${dataLayerPassed} ${requestPassed} ${timestamp}.xlsx`,
        'Sheet1',
        data,
        eventId,
        projectSlug
      );
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async inspectDataLayer(
    page: Page,
    projectName: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    return await this.inspectorSingleEventService.inspectDataLayer(
      page,
      projectName,
      eventId,
      headless,
      measurementId,
      credentials,
      captureRequest,
      eventInspectionPresetDto.application
    );
  }

  private prepareData(result: {
    dataLayerResult: ValidationResult;
    destinationUrl: string;
    rawRequest: string;
    requestCheckResult: ValidationResult;
  }) {
    return [
      {
        dataLayerResult: result.dataLayerResult,
        rawRequest: result.rawRequest,
        requestCheckResult: result.requestCheckResult,
        destinationUrl: result.destinationUrl,
      },
    ];
  }

  private async writeAbstractReport(
    result: {
      dataLayerResult: ValidationResult;
      destinationUrl: string;
      rawRequest: string;
      requestCheckResult: ValidationResult;
    },
    projectSlug: string,
    eventId: string
  ) {
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

    await this.projectAbstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      outputValidationResult
    );
  }
}
