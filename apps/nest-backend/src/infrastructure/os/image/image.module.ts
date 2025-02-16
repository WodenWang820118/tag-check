import { Module } from '@nestjs/common';
import { PathModule } from '../path/path.module';
import { ImageService } from './image.service';
import { TestReportFacadeModule } from '../../../features/repository/test-report-facade/test-report-facade.module';
import { TestReportFacadeRepositoryService } from '../../../features/repository/test-report-facade/test-report-facade-repository.service';

@Module({
  imports: [PathModule, TestReportFacadeModule],
  providers: [ImageService, TestReportFacadeRepositoryService],
  exports: [ImageService]
})
export class ImageModule {}
