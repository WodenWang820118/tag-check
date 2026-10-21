import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CreateTestEventDetailDto,
  TestEventDetailEntity,
  TestEventDetailResponseDto,
  TestEventEntity,
  UpdateTestEventDetailDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';
import type { RunSummary } from '@utils';

@Injectable()
export class TestEventDetailRepositoryService {
  constructor(
    @InjectRepository(TestEventDetailEntity)
    private readonly repository: Repository<TestEventDetailEntity>,
    @InjectRepository(TestEventEntity)
    private readonly testEventRepository: Repository<TestEventEntity>
  ) {}

  /**
   * Every run of the project's tests, newest first, with only the columns the
   * Reports page shows: no raw request, data layer or screenshot.
   */
  async listRunSummaries(projectSlug: string): Promise<RunSummary[]> {
    const runs = await this.repository.find({
      select: {
        id: true,
        passed: true,
        requestPassed: true,
        createdAt: true,
        testEvent: { id: true, eventId: true, eventName: true, testName: true }
      },
      relations: { testEvent: true },
      where: { testEvent: { project: { projectSlug } } },
      order: { createdAt: 'DESC', id: 'DESC' }
    });
    return runs.map((run) => ({
      runId: run.id,
      eventId: run.testEvent.eventId,
      eventName: run.testEvent.eventName,
      testName: run.testEvent.testName,
      passed: run.passed,
      requestPassed: run.requestPassed,
      runAt: run.createdAt
    }));
  }

  async getBySlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.findOne({
      relations: {
        testEvent: true
      },
      where: {
        testEvent: {
          project: {
            projectSlug
          },
          eventId
        }
      },
      order: {
        createdAt: 'DESC'
      }
    });
    return plainToInstance(TestEventDetailResponseDto, entity);
  }

  async getBySlugAndEventIds(projectSlug: string, eventIds: string[]) {
    const entities = await this.repository.find({
      relations: {
        testEvent: true
      },
      where: {
        testEvent: {
          project: {
            projectSlug
          },
          eventId: In(eventIds)
        }
      }
    });
    return entities.map((entity) =>
      plainToInstance(TestEventDetailResponseDto, entity)
    );
  }

  async create(
    testEventEntity: TestEventEntity,
    data: CreateTestEventDetailDto
  ) {
    try {
      const testEventDetailEntity = new TestEventDetailEntity();

      testEventDetailEntity.dataLayer = data.dataLayer;
      testEventDetailEntity.destinationUrl = data.destinationUrl;
      testEventDetailEntity.passed = data.passed;
      testEventDetailEntity.requestPassed = data.requestPassed;
      testEventDetailEntity.rawRequest = data.rawRequest;
      testEventDetailEntity.testEvent = testEventEntity;

      const entity = await this.repository.save(testEventDetailEntity);
      return plainToInstance(TestEventDetailResponseDto, entity);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async update(
    projectSlug: string,
    eventId: string,
    data: UpdateTestEventDetailDto
  ) {
    try {
      const testEvent = await this.testEventRepository.findOne({
        relations: { project: true },
        where: {
          eventId: eventId,
          project: { projectSlug: projectSlug }
        }
      });
      if (!testEvent)
        throw new HttpException('TestEvent not found', HttpStatus.NOT_FOUND);

      const newDetail = new TestEventDetailEntity();
      newDetail.passed = data.passed ?? false;
      newDetail.requestPassed = data.requestPassed ?? false;
      newDetail.rawRequest = data.rawRequest ?? '';
      newDetail.destinationUrl = data.destinationUrl ?? '';
      newDetail.dataLayer = data.dataLayer ?? [];

      const entity = await this.repository.update(
        { testEvent: testEvent },
        newDetail
      );

      return plainToInstance(TestEventDetailResponseDto, entity);
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        'Error updating test event detail',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
