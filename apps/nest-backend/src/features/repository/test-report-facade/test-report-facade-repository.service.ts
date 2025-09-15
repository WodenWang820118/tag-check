import { Injectable, Logger } from '@nestjs/common';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import {
  CreateFullTestEventDto,
  CreateItemDefDto,
  CreateSpecDto,
  CreateTestEventDetailDto,
  CreateTestEventDto
} from '../../../shared';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
import { ItemDefRepositoryService } from '../../../core/repository/item-def/item-def-repository.service';

@Injectable()
export class TestReportFacadeRepositoryService {
  constructor(
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly testImageRepositoryService: TestImageRepositoryService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly itemDefRepositoryService: ItemDefRepositoryService
  ) {}

  async createAbstractReport(
    projectSlug: string,
    eventId: string,
    data: CreateTestEventDto &
      CreateTestEventDetailDto &
      CreateSpecDto &
      CreateItemDefDto
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
        dataLayer: []
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
      dataLayerSpec: data.dataLayerSpec,
      rawGtmTag: data.rawGtmTag
    });

    const itemDefCreation = data.fullItemDef
      ? this.itemDefRepositoryService.create(testEventEntity, data)
      : Promise.resolve();

    return Promise.all([
      testEventDetailCreation,
      recordingCreation,
      specCreation,
      itemDefCreation
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
      await this.testEventRepositoryService.create(projectEntity, {
        eventId: data.reportDetails.eventId,
        testName: data.reportDetails.testName,
        eventName: data.reportDetails.eventName,
        message: data.reportDetails.message
      });

      const testEvent =
        await this.testEventRepositoryService.getEntityByEventId(eventId);

      // Create recording
      await this.recordingRepositoryService.create(testEvent, {
        title: data.reportDetails.eventName,
        steps: data.recording.steps ?? []
      });

      // Create spec
      await this.specRepositoryService.create(testEvent, {
        event: data.reportDetails.eventName,
        eventName: data.reportDetails.eventName,
        dataLayerSpec: data.dataLayerSpec,
        rawGtmTag: data.spec
      });

      // Create item definition if provided in the full report DTO
      if (data.fullItemDef) {
        await this.itemDefRepositoryService.create(testEvent, {
          fullItemDef: data.fullItemDef.fullItemDef,
          itemId: data.fullItemDef.itemId,
          templateName: data.fullItemDef.templateName
        });
      }

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

    const testEventDetails =
      await this.testEventDetailRepositoryService.getBySlugAndEventId(
        projectSlug,
        eventId
      );

    const testImage = await this.testImageRepositoryService.getBySlugAndEventId(
      projectSlug,
      eventId
    );

    return {
      testEvent,
      testEventDetails,
      testImage
    };
  }
}
