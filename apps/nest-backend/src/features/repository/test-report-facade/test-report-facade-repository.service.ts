import { Injectable, Logger } from '@nestjs/common';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import {
  CreateFullTestEventDto,
  CreateSpecDto,
  CreateTestEventDetailDto,
  CreateTestEventDto
} from '../../../shared';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';

@Injectable()
export class TestReportFacadeRepositoryService {
  constructor(
    private projectRepositoryService: ProjectRepositoryService,
    private testEventRepositoryService: TestEventRepositoryService,
    private testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private specRepositoryService: SpecRepositoryService,
    private testImageRepositoryService: TestImageRepositoryService,
    private recordingRepositoryService: RecordingRepositoryService
  ) {}

  async createAbstractReport(
    projectSlug: string,
    eventId: string,
    data: CreateTestEventDto & CreateTestEventDetailDto & CreateSpecDto
  ) {
    // Get the project entity by slug
    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);

    // Create a test event entity
    await this.testEventRepositoryService.create(projectEntity, {
      eventId: data.eventId,
      testName: data.testName,
      eventName: data.eventName,
      message: data.message
    });

    // Get the test event entity by event id to be used in the following operations
    const testEventEntity =
      await this.testEventRepositoryService.getEntityByEventId(eventId);

    const testEventDetailCreation =
      await this.testEventDetailRepositoryService.create(testEventEntity, {
        passed: false,
        requestPassed: false,
        rawRequest: '',
        destinationUrl: '',
        dataLayer: {},
        reformedDataLayer: {}
      });

    const recordingCreation = this.recordingRepositoryService.create(
      testEventEntity,
      {
        title: data.eventName,
        steps: []
      }
    );

    const specCreation = this.specRepositoryService.create(testEventEntity, {
      event: data.eventName,
      eventName: data.eventName,
      dataLayerSpec: data.dataLayerSpec
    });

    return Promise.all([
      testEventDetailCreation,
      recordingCreation,
      specCreation
    ]);
  }
  /**
   * Initialize all nessessary entities for a full report to be used
   * @param projectSlug
   * @param eventId
   * @param data
   * @returns
   */
  async createFullReport(
    projectSlug: string,
    eventId: string,
    data: CreateFullTestEventDto
  ) {
    try {
      // Get the project entity by slug
      const projectEntity =
        await this.projectRepositoryService.getEntityBySlug(projectSlug);

      // Create test event first
      const testEventEntity = await this.testEventRepositoryService.create(
        projectEntity,
        {
          eventId: data.reportDetails.eventId,
          testName: data.reportDetails.testName,
          eventName: data.reportDetails.eventName,
          message: data.reportDetails.message
        }
      );

      const testEvent =
        await this.testEventRepositoryService.getEntityByEventId(eventId);

      // Create recording
      const recordingEntity = await this.recordingRepositoryService.create(
        testEvent,
        {
          title: data.reportDetails.eventName,
          steps: data.recording.steps ?? []
        }
      );

      // Create spec
      const specEntity = await this.specRepositoryService.create(testEvent, {
        event: data.reportDetails.eventName,
        eventName: data.reportDetails.eventName,
        dataLayerSpec: data.spec
      });

      // Fetch the complete updated test event with all relations
      const updatedTestEvent =
        await this.testEventRepositoryService.getBySlugAndEventId(
          projectSlug,
          eventId
        );

      return updatedTestEvent;
    } catch (error) {
      Logger.error('Error in createFullReport:', error);
      throw error;
    }
  }

  async getReportDetail(projectSlug: string, eventId: string) {
    const testEvent = await this.testEventRepositoryService.getBySlugAndEventId(
      projectSlug,
      eventId
    );

    const testEventDetail =
      await this.testEventDetailRepositoryService.getBySlugAndEventId(
        projectSlug,
        eventId
      );

    const testImage = await this.testImageRepositoryService.getBySlugAndEventId(
      projectSlug,
      eventId
    );

    return [testEvent, testEventDetail, testImage];
  }
}
