import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../../../core/configs/configs.module';
import { TestFileReportEntity } from '../../../shared/entity/test-file-report.entity';
import { TestImageEntity } from '../../../shared/entity/test-image.entity';
import { FullValidationResultService } from './full-validation-result.service';
import { TestDataLayerEntity } from '../../../shared';
import { RepositoryModule } from '../../../core/repository/repository.module';
@Module({
  imports: [
    RepositoryModule,
    TypeOrmModule.forFeature([
      TestFileReportEntity,
      TestImageEntity,
      TestDataLayerEntity
    ]),
    ConfigsModule
  ],
  providers: [FullValidationResultService],
  exports: [
    TypeOrmModule.forFeature([
      TestFileReportEntity,
      TestImageEntity,
      TestDataLayerEntity
    ]),
    FullValidationResultService
  ]
})
export class TestReportFacadeModule {}
