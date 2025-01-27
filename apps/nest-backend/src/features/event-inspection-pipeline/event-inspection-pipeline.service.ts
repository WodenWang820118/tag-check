/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import {
  OutputValidationResult,
  ValidationResult,
  extractEventNameFromId
} from '@utils';
import { InspectorSingleEventService } from '../../features/inspector/inspector-single-event.service';
import { ProjectAbstractReportService } from '../../features/project-agent/project-abstract-report/project-abstract-report.service';
import { TestResultService } from '../test-result/test-result.service';
import { TestFileReportEntity, EventInspectionPresetDto } from '../../shared';
import { ImageResultService } from '../test-result/image-result.service';
@Injectable()
export class EventInspectionPipelineService {
  private readonly logger = new Logger(EventInspectionPipelineService.name);
  constructor(
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly projectAbstractReportService: ProjectAbstractReportService,
    private readonly testResultService: TestResultService,
    private readonly imageResultService: ImageResultService
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

      // The ID and createdAt will be handled by the database
      // const testResult: Partial<TestFileReportEntity> = {
      //   projectSlug: projectSlug,
      //   eventId: eventId,
      //   testName: `${eventName}_${timestamp}`,
      //   eventName: eventName,
      //   passed: result.dataLayerResult.passed,
      //   requestPassed: result.requestCheckResult.passed,
      //   rawRequest: result.rawRequest,
      //   message: result.dataLayerResult.message || 'failed',
      //   destinationUrl: result.destinationUrl
      // };
      const testResult = {} as Partial<TestFileReportEntity>;
      this.logger.debug('Test Result:', JSON.stringify(testResult, null, 2));
      await this.testResultService.create(testResult);
      await this.writeAbstractReport(result, projectSlug, eventId);
      return data;
    } catch (error) {
      this.logger.error(error);
      // TODO: get test name from database for users to locate the failed test
      await this.testResultService.create({
        projectSlug: projectSlug,
        eventId: eventId,
        testName: extractEventNameFromId(eventId),
        eventName: extractEventNameFromId(eventId),
        passed: false,
        requestPassed: false,
        rawRequest: '',
        message: `${error}`,
        destinationUrl: ''
      });

      const screenshot = await page.screenshot({
        fullPage: true
      });

      await this.imageResultService.create({
        imageName: `${projectSlug}_${eventId}`,
        imageData: screenshot
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

    const outputValidationResult: Partial<OutputValidationResult> = {
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
      createdAt: new Date()
    };

    await this.projectAbstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      outputValidationResult
    );
  }
}
