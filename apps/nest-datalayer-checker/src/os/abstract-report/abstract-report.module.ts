import { Module } from '@nestjs/common';
import { AbstractReportService } from './abstract-report.service';
import { FolderPathModule } from '../path/folder-path/folder-path.module';
import { FolderModule } from '../folder/folder.module';
import { FilePathModule } from '../path/file-path/file-path.module';
import { FilePathService } from '../path/file-path/file-path.service';
@Module({
  imports: [FolderPathModule, FolderModule, FilePathModule],
  providers: [AbstractReportService, FilePathService],
  exports: [AbstractReportService],
})
export class AbstractReportModule {}
