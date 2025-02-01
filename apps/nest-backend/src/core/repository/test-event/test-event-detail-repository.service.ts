import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CreateTestEventDetailDto,
  TestEventDetailEntity,
  TestEventDetailResponseDto,
  TestEventEntity
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TestEventDetailRepositoryService {
  constructor(
    @InjectRepository(TestEventDetailEntity)
    private readonly repository: Repository<TestEventDetailEntity>
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
    const testEventDetailEntity = new TestEventDetailEntity();

    testEventDetailEntity.dataLayer = data.dataLayer;
    testEventDetailEntity.reformedDataLayer = data.reformedDataLayer;
    testEventDetailEntity.destinationUrl = data.destinationUrl;
    testEventDetailEntity.passed = data.passed;
    testEventDetailEntity.requestPassed = data.requestPassed;
    testEventDetailEntity.rawRequest = data.rawRequest;
    testEventDetailEntity.testEvent = testEventEntity;

    const entity = await this.repository.save(testEventDetailEntity);
    return plainToInstance(TestEventDetailEntity, entity);
  }
}
