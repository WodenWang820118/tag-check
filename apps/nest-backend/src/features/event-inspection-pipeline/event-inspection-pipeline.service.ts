import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { InspectorSingleEventService } from '../../features/inspector/inspector-single-event.service';

import {
  EventInspectionPresetDto,
  UpdateTestEventDetailDto
} from '../../shared';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
@Injectable()
export class EventInspectionPipelineService {
  private readonly logger = new Logger(EventInspectionPipelineService.name);
  constructor(
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly testImageRepositoryService: TestImageRepositoryService
  ) {}

  async singleEventInspectionRecipe(
    page: Page,
    projectSlug: string,
    eventId: string,
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

      const updatedDetail: UpdateTestEventDetailDto = {
        passed: result.dataLayerResult.passed,
        requestPassed: result.requestCheckResult.passed,
        rawRequest: result.rawRequest,
        destinationUrl: result.destinationUrl,
        dataLayer: result.dataLayerResult.dataLayer,
        reformedDataLayer: {}
      };
      // TODO: might create a test event report to be downloaded by users here
      // here only update the latest test event detail
      await this.testEventDetailRepositoryService.update(
        projectSlug,
        eventId,
        updatedDetail
      );
      return data;
    } catch (error) {
      this.logger.error(error);
      // TODO: get test name from database for users to locate the failed test
      await this.testEventDetailRepositoryService.update(projectSlug, eventId, {
        passed: false,
        requestPassed: false,
        rawRequest: '',
        destinationUrl: '',
        dataLayer: {},
        reformedDataLayer: {}
      });

      const screenshot = await page.screenshot({
        fullPage: true
      });

      await this.testImageRepositoryService.create(projectSlug, eventId, {
        imageName: `${projectSlug}_${eventId}`,
        imageData: screenshot
      });
    }
  }
}
