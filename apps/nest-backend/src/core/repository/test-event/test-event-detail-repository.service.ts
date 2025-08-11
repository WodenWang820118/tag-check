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

@Injectable()
export class TestEventDetailRepositoryService {
  constructor(
    @InjectRepository(TestEventDetailEntity)
    private readonly repository: Repository<TestEventDetailEntity>,
    @InjectRepository(TestEventEntity)
    private readonly testEventRepository: Repository<TestEventEntity>
  ) {}

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
      testEventDetailEntity.reformedDataLayer = data.reformedDataLayer;
      testEventDetailEntity.destinationUrl = data.destinationUrl;
      testEventDetailEntity.passed = data.passed;
      testEventDetailEntity.requestPassed = data.requestPassed;
      testEventDetailEntity.rawRequest = data.rawRequest;
      testEventDetailEntity.testEvent = testEventEntity;

      const entity = await this.repository.save(testEventDetailEntity);
      return plainToInstance(TestEventDetailResponseDto, entity);
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
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
      newDetail.reformedDataLayer = data.reformedDataLayer ?? [];

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
