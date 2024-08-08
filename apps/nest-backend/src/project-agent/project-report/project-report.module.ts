import { Module } from '@nestjs/common';
import { ProjectReportService } from './project-report.service';
import { ProjectAbstractReportModule } from '../project-abstract-report/project-abstract-report.module';

@Module({
  imports: [ProjectAbstractReportModule],
  providers: [ProjectReportService],
  exports: [ProjectReportService],
})
export class ProjectReportModule {}
