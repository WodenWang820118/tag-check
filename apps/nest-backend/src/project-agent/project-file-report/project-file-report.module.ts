import { Module } from '@nestjs/common';
import { OsModule } from '../../os/os.module';
import { ProjectFileReportService } from './project-file-report.service';
import { FileService } from '../../os/file/file.service';

@Module({
  imports: [OsModule],
  providers: [FileService, ProjectFileReportService],
  exports: [ProjectFileReportService],
})
export class ProjectFileReportModule {}
