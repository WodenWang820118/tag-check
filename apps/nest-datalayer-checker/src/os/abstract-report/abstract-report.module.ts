import { Module } from '@nestjs/common';
import { AbstractReportService } from './abstract-report.service';
import { FolderPathModule } from '../path/folder-path/folder-path.module';
import { FolderModule } from '../folder/folder.module';

@Module({
  imports: [FolderPathModule, FolderModule],
  providers: [AbstractReportService],
  exports: [AbstractReportService],
})
export class AbstractReportModule {}
