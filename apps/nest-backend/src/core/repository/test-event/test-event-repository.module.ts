import { Module } from '@nestjs/common';
import { TestEventRepositoryService } from './test-event-repository.service';
import { TestImageRepositoryService } from './test-image-repository.service';
import { TestEventDetailRepositoryService } from './test-event-detail-repository.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TestEventDetailEntity,
  TestEventEntity,
  TestImageEntity
} from '../../../shared';

const modules = [
  TypeOrmModule.forFeature([
    TestEventEntity,
    TestEventDetailEntity,
    TestImageEntity
  ])
];

const services = [
  TestEventRepositoryService,
  TestImageRepositoryService,
  TestEventDetailRepositoryService
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class TestEventRepositoryModule {}
