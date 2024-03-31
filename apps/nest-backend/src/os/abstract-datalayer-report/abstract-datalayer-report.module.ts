import { Module } from '@nestjs/common';
import { AbstractDatalayerReportService } from './abstract-datalayer-report.service';
import { FolderPathModule } from '../path/folder-path/folder-path.module';
import { FolderModule } from '../folder/folder.module';
import { FilePathModule } from '../path/file-path/file-path.module';
import { FilePathService } from '../path/file-path/file-path.service';
import { FileModule } from '../file/file.module';
@Module({
  imports: [FolderPathModule, FolderModule, FilePathModule, FileModule],
  providers: [AbstractDatalayerReportService, FilePathService],
  exports: [AbstractDatalayerReportService],
})
export class AbstractDatalayerReportModule {}
