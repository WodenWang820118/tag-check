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

  async getTestImage(eventId: string) {
    const testEvent =
      await this.testEventRepositoryService.getByEventId(eventId);
    if (testEvent === null) {
      throw new HttpException('No event found', HttpStatus.NOT_FOUND);
    }
    return this.testImageRepositoryService.get(testEvent.id);
  }

  async createTestImage(data: CreateTestImageDto) {
    return this.testImageRepositoryService.create(data);
  }

  async getTestDataLayer(eventId: string) {
    const testEvent =
      await this.testEventRepositoryService.getByEventId(eventId);
    if (testEvent === null) {
      throw new HttpException('No event found', HttpStatus.NOT_FOUND);
    }
    return this.testDataLayerRepositoryService.get(testEvent.id);
  }

  async updateTestLayer(eventId: string, data: UpdateTestDataLayerDto) {
    const testEvent =
      await this.testEventRepositoryService.getByEventId(eventId);
    if (testEvent === null) {
      throw new HttpException('No event found', HttpStatus.NOT_FOUND);
    }
    return this.testDataLayerRepositoryService.update(testEvent.id, data);
  }

  async listFileReports(projectSlug: string) {
    const project = await this.projectRepositoryService.getBySlug(projectSlug);
    if (project === null) {
      throw new HttpException('No project found', HttpStatus.OK);
    }

    return this.testEventRepositoryService.list(project.id);
  }

  async deleteFileReport(projectSlug: string, eventId: string) {
    const project = await this.projectRepositoryService.getBySlug(projectSlug);
    if (project === null) {
      throw new HttpException('No project found', HttpStatus.NOT_FOUND);
    }

    const testEvents = await this.testEventRepositoryService.list(project.id);
    const testEvent = testEvents.find((event) => event.eventId === eventId);

    if (testEvent === undefined) {
      throw new HttpException('No event found', HttpStatus.NOT_FOUND);
    }

    return this.testEventRepositoryService.delete(testEvent.eventId);
  }

  async deleteFileReports(projectSlug: string, eventIds: string[]) {
    const project = await this.projectRepositoryService.getBySlug(projectSlug);
    if (project === null) {
      throw new HttpException('No project found', HttpStatus.NOT_FOUND);
    }

    const testEvents = await this.testEventRepositoryService.list(project.id);
    const testEvent = testEvents.filter((event) =>
      eventIds.includes(event.eventId)
    );

    if (testEvent === undefined) {
      throw new HttpException('No event found', HttpStatus.NOT_FOUND);
    }

    return this.testEventRepositoryService.deleteMany(
      testEvent.map((event) => event.eventId)
    );
  }

  async createTestFileReport(
    data: CreateTestEventDto & CreateTestInfoDto & CreateTestRequestInfoDto
  ) {
    const testEventCreation = this.testEventRepositoryService.create({
      eventId: data.eventId,
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
