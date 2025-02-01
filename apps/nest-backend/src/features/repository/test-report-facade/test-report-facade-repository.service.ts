import { Injectable } from '@nestjs/common';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import {
  CreateTestEventDto,
  CreateTestEventDetailDto,
  CreateSpecDto
} from '../../../shared';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';

@Injectable()
export class TestReportFacadeRepositoryService {
  constructor(
    private projectRepositoryService: ProjectRepositoryService,
    private testEventRepositoryService: TestEventRepositoryService,
    private testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private specRepositoryService: SpecRepositoryService,
    private testImageRepositoryService: TestImageRepositoryService
  ) {}

  async createAbstractReport(
    projectSlug: string,
    eventId: string,
    data: CreateTestEventDto & CreateTestEventDetailDto & CreateSpecDto
  ) {
    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);

    const testEventCreation = await this.testEventRepositoryService.create(
      projectEntity,
      {
        eventId: data.eventId,
        testName: data.testName,
        eventName: data.eventName,
        message: data.message
      }
    );

    const testEventEntity =
      await this.testEventRepositoryService.getEntityByEventId(eventId);

    const testEventDetailCreation =
      await this.testEventDetailRepositoryService.create(testEventEntity, {
        passed: data.passed,
        requestPassed: data.requestPassed,
        rawRequest: data.rawRequest,
        destinationUrl: data.destinationUrl,
        dataLayer: data.dataLayer,
        reformedDataLayer: data.reformedDataLayer
      });

    const specCreation = this.specRepositoryService.create(testEventEntity, {
      eventName: data.eventName,
      dataLayerSpec: data.dataLayerSpec
    });

    return Promise.all([
      testEventCreation,
      testEventDetailCreation,
      specCreation
    ]);
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

    return Promise.all([testEvent, testEventDetail, testImage]);
  }
}
