import { Module } from '@nestjs/common';
import { TestDataLayerRepositoryService } from './test-data-layer-repository.service';
import { TestEventRepositoryService } from './test-event-repository.service';
import { TestImageRepositoryService } from './test-image-repository.service';
import { TestInfoRepositoryService } from './test-info-repository.service';
import { TestRequestInfoRepositoryService } from './test-request-info-repository.service';
import { TestFileReportRepositoryService } from './test-file-report-repository.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TestDataLayerEntity,
  TestEventEntity,
  TestFileReportEntity,
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
    TestRequestInfoEntity,
    TestFileReportEntity
  ])
];

const services = [
  TestDataLayerRepositoryService,
  TestEventRepositoryService,
  TestImageRepositoryService,
  TestInfoRepositoryService,
  TestRequestInfoRepositoryService,
  TestFileReportRepositoryService
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class TestEventRepositoryModule {}
