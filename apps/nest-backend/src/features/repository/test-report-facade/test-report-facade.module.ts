import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../../../core/configs/configs.module';
import { TestImageEntity } from '../../../shared/entity/test-image.entity';
import { RepositoryModule } from '../../../core/repository/repository.module';
import { TestReportFacadeRepositoryService } from './test-report-facade-repository.service';
@Module({
  imports: [
    RepositoryModule,
    TypeOrmModule.forFeature([TestImageEntity]),
    ConfigsModule
  ],
  providers: [TestReportFacadeRepositoryService],
  exports: [
    TypeOrmModule.forFeature([TestImageEntity]),
    RepositoryModule,
    TestReportFacadeRepositoryService
  ]
})
export class TestReportFacadeModule {}
