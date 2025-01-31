import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestEventDetailDto,
  TestEventDetailEntity,
  TestEventEntity
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TestEventDetailRepositoryService {
  constructor(
    @InjectRepository(TestEventDetailEntity)
    private readonly repository: Repository<TestEventDetailEntity>
  ) {}

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
