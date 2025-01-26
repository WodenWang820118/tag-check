import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../../core/configs/configs.module';
import { TestResultService } from './test-result.service';
import { TestResult } from '../../shared/entity/test-result.entity';
import { ImageResult } from '../../shared/entity/image-result.entity';
import { ImageResultService } from './image-result.service';
import { TestDataLayerService } from './test-data-layer.service';
import { TestDataLayer } from '../../shared/entity/test-data-layer.entity';
import { FullValidationResultService } from './full-validation-result.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([TestResult, ImageResult, TestDataLayer]),
    ConfigsModule
  ],
  providers: [
    TestResultService,
    ImageResultService,
    TestDataLayerService,
    FullValidationResultService
  ],
  exports: [
    TypeOrmModule.forFeature([TestResult, ImageResult, TestDataLayer]),
    TestResultService,
    ImageResultService,
    TestDataLayerService,
    FullValidationResultService
  ]
})
export class TestResultModule {}
