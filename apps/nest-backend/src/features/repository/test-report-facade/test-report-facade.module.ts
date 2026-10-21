import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { TestReportFacadeRepositoryService } from './test-report-facade-repository.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [TestReportFacadeRepositoryService],
  exports: [TestReportFacadeRepositoryService]
})
export class TestReportFacadeModule {}
