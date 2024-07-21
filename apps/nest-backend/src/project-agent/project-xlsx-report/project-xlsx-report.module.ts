import { Module } from '@nestjs/common';
import { OsModule } from '../../os/os.module';
import { ProjectXlsxReportService } from './project-xlsx-report.service';

@Module({
  imports: [OsModule],
  providers: [ProjectXlsxReportService],
  exports: [ProjectXlsxReportService, OsModule],
})
export class ProjectXlsxRportModule {}
