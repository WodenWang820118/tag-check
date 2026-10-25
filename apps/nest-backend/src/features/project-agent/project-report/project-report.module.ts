import { Module } from '@nestjs/common';
import { ProjectReportService } from './project-report.service';
import { OsModule } from '../../../infrastructure/os/os.module';

@Module({
  imports: [OsModule],
  providers: [ProjectReportService],
  exports: [ProjectReportService]
})
export class ProjectReportModule {}
