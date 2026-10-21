import { Module } from '@nestjs/common';
import { ProjectAbstractReportService } from './project-abstract-report.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { OsModule } from '../../../infrastructure/os/os.module';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectAbstractReportService, FilePathService],
  exports: [ProjectAbstractReportService, OsModule]
})
export class ProjectAbstractReportModule {}
