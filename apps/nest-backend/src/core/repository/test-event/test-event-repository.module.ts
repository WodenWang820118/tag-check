import { Module } from '@nestjs/common';
import { TestDataLayerRepositoryService } from './test-data-layer-repository.service';
import { TestEventRepositoryService } from './test-event-repository.service';
import { TestImageRepositoryService } from './test-image-repository.service';
import { TestInfoRepositoryService } from './test-info-repository.service';
import { TestRequestInfoRepositoryService } from './test-request-info-repository.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TestDataLayerEntity,
  TestEventEntity,
  TestImageEntity,
  TestInfoEntity,
  TestRequestInfoEntity
} from '../../../shared';

const modules = [
  TypeOrmModule.forFeature([
    TestDataLayerEntity,
    TestEventEntity,
    TestImageEntity,
    TestInfoEntity,
    TestRequestInfoEntity
  ])
];

const services = [
  TestDataLayerRepositoryService,
  TestEventRepositoryService,
  TestImageRepositoryService,
  TestInfoRepositoryService,
  TestRequestInfoRepositoryService
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class TestEventRepositoryModule {}
