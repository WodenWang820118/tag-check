import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../core/configs/configs.module';
import { TestResultService } from './services/test-result.service';
import { TestResult } from './entity/test-result.entity';
import { ImageResult } from './entity/image-result.entity';
import { ImageResultService } from './services/image-result.service';
import { TestDataLayerService } from './services/test-data-layer.service';
import { TestDataLayer } from './entity/test-data-layer.entity';
import { FullValidationResultService } from './services/full-validation-result.service';
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
