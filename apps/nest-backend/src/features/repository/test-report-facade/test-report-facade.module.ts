import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../../../core/configs/configs.module';
import { TestImageEntity } from '../../../shared/entity/test-image.entity';
import { FullValidationResultService } from './full-validation-result.service';
import { TestDataLayerEntity } from '../../../shared';
import { RepositoryModule } from '../../../core/repository/repository.module';
@Module({
  imports: [
    RepositoryModule,
    TypeOrmModule.forFeature([TestImageEntity, TestDataLayerEntity]),
    ConfigsModule
  ],
  providers: [FullValidationResultService],
  exports: [
    TypeOrmModule.forFeature([TestImageEntity, TestDataLayerEntity]),
    FullValidationResultService,
    RepositoryModule
  ]
})
export class TestReportFacadeModule {}
