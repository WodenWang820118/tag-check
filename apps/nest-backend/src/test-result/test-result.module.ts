import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../configs/configs.module';
import { TestResultService } from './services/test-result.service';
import { TestResult } from './entity/test-result.entity';
import { ImageResult } from './entity/image_result.entity';
import { ImageResultService } from './services/image-result.service';
@Module({
  imports: [TypeOrmModule.forFeature([TestResult, ImageResult]), ConfigsModule],
  providers: [TestResultService, ImageResultService],
  exports: [
    TypeOrmModule.forFeature([TestResult, ImageResult]),
    TestResultService,
    ImageResultService
  ]
})
export class TestResultModule {}
