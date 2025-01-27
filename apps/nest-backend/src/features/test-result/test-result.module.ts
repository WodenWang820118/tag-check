import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../../core/configs/configs.module';
import { TestResultService } from './test-result.service';
import { TestFileReportEntity } from '../../shared/entity/test-file-report.entity';
import { TestImageEntity } from '../../shared/entity/test-image.entity';
import { ImageResultService } from './image-result.service';
import { TestDataLayerService } from './test-data-layer.service';
import { FullValidationResultService } from './full-validation-result.service';
import { TestDataLayerEntity } from '../../shared';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestFileReportEntity,
      TestImageEntity,
      TestDataLayerEntity
    ]),
    ConfigsModule
  ],
  providers: [
    TestResultService,
    ImageResultService,
    TestDataLayerService,
    FullValidationResultService
  ],
  exports: [
    TypeOrmModule.forFeature([
      TestFileReportEntity,
      TestImageEntity,
      TestDataLayerEntity
    ]),
    TestResultService,
    ImageResultService,
    TestDataLayerService,
    FullValidationResultService
  ]
})
export class TestResultModule {}
