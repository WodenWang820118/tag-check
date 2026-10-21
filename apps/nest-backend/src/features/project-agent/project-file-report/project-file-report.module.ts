import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectFileReportService } from './project-file-report.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectFileReportService],
  exports: [ProjectFileReportService]
})
export class ProjectFileReportModule {}
