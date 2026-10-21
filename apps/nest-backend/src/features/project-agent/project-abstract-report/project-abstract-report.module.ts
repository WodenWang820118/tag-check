import { Module } from '@nestjs/common';
import { ProjectAbstractReportService } from './project-abstract-report.service';
import { OsModule } from '../../../infrastructure/os/os.module';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectAbstractReportService],
  exports: [ProjectAbstractReportService, OsModule]
})
export class ProjectAbstractReportModule {}
