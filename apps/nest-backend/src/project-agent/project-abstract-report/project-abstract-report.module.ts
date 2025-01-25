import { Module } from '@nestjs/common';
import { ProjectAbstractReportService } from './project-abstract-report.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { OsModule } from '../../infrastructure/os/os.module';

@Module({
  imports: [OsModule],
  providers: [ProjectAbstractReportService, FilePathService],
  exports: [ProjectAbstractReportService, OsModule]
})
export class ProjectAbstractReportModule {}
