import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { InspectorSingleEventService } from '../../features/inspector/inspector-single-event.service';
import {
  CreateTestEventDetailDto,
  EventInspectionPresetDto,
  TestEventDetailResponseDto,
  TestEventEntity,
  TestImageResponseDto,
  UpdateTestEventDto
} from '../../shared';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { ValidationResult } from '@utils';

@Injectable()
export class EventInspectionPipelineService {
  private readonly logger = new Logger(EventInspectionPipelineService.name);

  constructor(
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
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
    // Retrieve the test event once since it is needed in both paths.
    const testEvent = await this.getTestEvent(projectSlug, eventId);

    try {
      // Call the inspector service to get the inspection result.
      const {
        dataLayerResult,
        destinationUrl,
        rawRequest,
        requestCheckResult
      } = await this.inspectorSingleEventService.inspectDataLayer(
        page,
        projectSlug,
        eventId,
        measurementId,
        credentials,
        captureRequest,
        eventInspectionPresetDto.application
      );
      this.logger.debug(
        'data layer result:',
        JSON.stringify(dataLayerResult, null, 2)
      );
      // Map service response to the output data format.
      const data = [
        {
          dataLayerResult,
          rawRequest,
          requestCheckResult,
          destinationUrl
        }
      ];
      this.logger.debug('Data to be saved:', JSON.stringify(data, null, 2));

      // Build detail DTO for a passed event.
      const updatedDetail = this.buildTestEventDetail({
        dataLayerResult,
        rawRequest,
        requestCheckResult,
        destinationUrl
      });

      this.logger.debug(
        'Updated detail:',
        JSON.stringify(updatedDetail, null, 2)
      );
      const testEventDetailDto =
        await this.testEventDetailRepositoryService.create(
          testEvent,
          updatedDetail
        );

      testEventDetailDto.message = dataLayerResult.message || '';

      const testImageDto = await this.buildTestImage(
        page,
        projectSlug,
        eventId
      );
      await this.updateLatestTestEvent(
        testEvent,
        testEventDetailDto,
        testImageDto
      );
      return data;
    } catch (error) {
      this.logger.error('Error during event inspection', error);
      // Build detail DTO for a failed event.
      const updatedDetail = this.buildFallbackTestEventDetail();
      const testEventDetailDto =
        await this.testEventDetailRepositoryService.create(
          testEvent,
          updatedDetail
        );
      const testImageDto = await this.buildTestImage(
        page,
        projectSlug,
        eventId
      );
      await this.updateLatestTestEvent(
        testEvent,
        testEventDetailDto,
        testImageDto
      );
    }
  }

  /**
   * Retrieves the test event based on projectSlug and eventId.
   */
  private async getTestEvent(projectSlug: string, eventId: string) {
    return await this.testEventRepositoryService.getEntityBySlugAndEventId(
      projectSlug,
      eventId
    );
  }

  /**
   * Builds a DTO for saving the event detail on successful inspection.
   */
  private buildTestEventDetail(result: {
    dataLayerResult: ValidationResult;
    destinationUrl: string;
    rawRequest: string;
    requestCheckResult: ValidationResult;
  }): CreateTestEventDetailDto {
    return {
      passed: result.dataLayerResult.passed || false,
      requestPassed: result.requestCheckResult.passed || false,
      rawRequest: result.rawRequest,
      destinationUrl: result.destinationUrl,
      dataLayer: result.dataLayerResult.dataLayer,
      reformedDataLayer: [] // placeholder for additional processing if needed
    };
  }

  /**
   * Builds a fallback DTO when an error occurs during inspection.
   */
  private buildFallbackTestEventDetail(): CreateTestEventDetailDto {
    return {
      passed: false,
      requestPassed: false,
      rawRequest: '',
      destinationUrl: '',
      dataLayer: [],
      reformedDataLayer: []
    };
  }

  private async buildTestImage(
    page: Page,
    projectSlug: string,
    eventId: string
  ) {
    const screenshot = await page.screenshot({ fullPage: true });
    return await this.testImageRepositoryService.create(projectSlug, eventId, {
      imageName: `screenshot.png`,
      imageData: screenshot
    });
  }

  private async updateLatestTestEvent(
    testEvent: TestEventEntity,
    testEventDetail: TestEventDetailResponseDto,
    testImage: TestImageResponseDto
  ) {
    const updatedInfo: UpdateTestEventDto = {
      latestTestEventDetailId: testEventDetail.id,
      latestTestImageId: testImage.id,
      message: testEventDetail.message
    };
    const updatedEvent = await this.testEventRepositoryService.updateTestEvent(
      testEvent.id,
      updatedInfo
    );
    this.logger.debug('Updated info:', JSON.stringify(updatedInfo, null, 2));
    this.logger.debug('Updated event:', JSON.stringify(updatedEvent, null, 2));
  }
}
