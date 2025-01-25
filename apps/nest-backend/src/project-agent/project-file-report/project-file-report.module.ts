import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { ProjectFileReportService } from './project-file-report.service';
import { FileService } from '../../infrastructure/os/file/file.service';

@Module({
  imports: [OsModule],
  providers: [FileService, ProjectFileReportService],
  exports: [ProjectFileReportService]
})
export class ProjectFileReportModule {}
