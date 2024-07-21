import { Module } from '@nestjs/common';
import { ProjectAbstractReportService } from './project-abstract-report.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { OsModule } from '../../os/os.module';

@Module({
  imports: [OsModule],
  providers: [ProjectAbstractReportService, FilePathService],
  exports: [ProjectAbstractReportService, OsModule],
})
export class ProjectAbstractReportModule {}
