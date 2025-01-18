/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import {
  OutputValidationResult,
  ValidationResult,
  extractEventNameFromId
} from '@utils';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { ProjectAbstractReportService } from '../project-agent/project-abstract-report/project-abstract-report.service';
import { TestResultService } from '../test-result/test-result.service';
import { TestResult } from '../test-result/entity/test-result.entity';
@Injectable()
export class EventInspectionPipelineService {
  private readonly logger = new Logger(EventInspectionPipelineService.name);
  constructor(
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly projectAbstractReportService: ProjectAbstractReportService,
    private readonly testResultService: TestResultService
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
    this.logger.log('Inspecting single event');
    try {
      const result = await this.inspectorSingleEventService.inspectDataLayer(
        page,
        projectSlug,
        eventId,
        headless,
        measurementId,
        credentials,
        captureRequest,
        eventInspectionPresetDto.application
      );
      this.logger.debug('Result:', JSON.stringify(result, null, 2));
      const data = [
        {
          dataLayerResult: result.dataLayerResult,
          rawRequest: result.rawRequest,
          requestCheckResult: result.requestCheckResult,
          destinationUrl: result.destinationUrl
        }
      ];

      this.logger.debug('Data:', JSON.stringify(data, null, 2));

      const timestamp = new Date().getTime();
      const eventName = extractEventNameFromId(eventId);
      const dataLayerPassed = result.dataLayerResult.passed;
      const requestPassed = result.requestCheckResult.passed;

      // The ID and createdAt will be handled by the database
      const testResult: Partial<TestResult> = {
        projectSlug: projectSlug,
        eventId: eventId,
        testName: `${eventName} ${dataLayerPassed} ${requestPassed} ${timestamp}`,
        eventName: eventName,
        passed: result.dataLayerResult.passed,
        requestPassed: result.requestCheckResult.passed,
        completedTime: new Date(),
        rawRequest: result.rawRequest,
        message: result.dataLayerResult.message || 'failed',
        destinationUrl: result.destinationUrl
      };
      this.logger.debug('Test Result:', JSON.stringify(testResult, null, 2));
      await this.testResultService.create(testResult);
      await this.writeAbstractReport(result, projectSlug, eventId);
      return data;
    } catch (error) {
      this.logger.error(error);
      // TODO customize error message
      await this.testResultService.create({
        projectSlug: projectSlug,
        eventId: eventId,
        testName: 'Error',
        eventName: 'Error',
        passed: false,
        requestPassed: false,
        completedTime: new Date(),
        rawRequest: '',
        message: `${error}`,
        destinationUrl: ''
      });
    }
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
      completedTime: new Date()
    };

    await this.projectAbstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      outputValidationResult
    );
  }
}
