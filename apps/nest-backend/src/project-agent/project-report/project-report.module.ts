import { Module } from '@nestjs/common';
import { ProjectReportService } from './project-report.service';
import { ProjectAbstractReportModule } from '../project-abstract-report/project-abstract-report.module';
import { ProjectAbstractReportService } from '../project-abstract-report/project-abstract-report.service';

@Module({
  imports: [ProjectAbstractReportModule],
  providers: [ProjectReportService, ProjectAbstractReportService],
  exports: [ProjectReportService],
})
export class ProjectReportModule {}
