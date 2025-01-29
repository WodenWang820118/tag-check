import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TestDataLayerRepositoryService } from '../../../core/repository/test-event/test-data-layer-repository.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import { TestInfoRepositoryService } from '../../../core/repository/test-event/test-info-repository.service';
import { TestRequestInfoRepositoryService } from '../../../core/repository/test-event/test-request-info-repository.service';
import {
  CreateTestEventDto,
  CreateTestImageDto,
  CreateTestInfoDto,
  CreateTestRequestInfoDto,
  UpdateTestDataLayerDto
} from '../../../shared';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';

@Injectable()
export class TestReportFacadeRepositoryService {
  constructor(
    private projectRepositoryService: ProjectRepositoryService,
    private testEventRepositoryService: TestEventRepositoryService,
    private testDataLayerRepositoryService: TestDataLayerRepositoryService,
    private testImageRepositoryService: TestImageRepositoryService,
    private testInfoRepositoryService: TestInfoRepositoryService,
    private testRequestInfoRepositoryService: TestRequestInfoRepositoryService
  ) {}

  async createTestFileReport(
    data: CreateTestEventDto & CreateTestInfoDto & CreateTestRequestInfoDto
  ) {
    const testEventCreation = this.testEventRepositoryService.create({
      eventId: data.eventId,
      testName: data.testName,
      eventName: data.eventName,
      message: data.message
    });

    const testInfoCreation = this.testInfoRepositoryService.create({
      testName: data.testName,
      eventName: data.eventName,
      passed: data.passed
    });

    const testRequestInfo = this.testRequestInfoRepositoryService.create({
      requestPassed: data.requestPassed,
      rawRequest: data.rawRequest,
      destinationUrl: data.destinationUrl
    });

    return Promise.all([testEventCreation, testInfoCreation, testRequestInfo]);
  }
}
