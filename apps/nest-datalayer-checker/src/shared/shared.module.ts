import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { ProjectModule } from './project/project.module';
import { ProjectService } from './project/project.service';
import { FileModule } from './file/file.module';
import { FileService } from './file/file.service';
import { XlsxWriterModule } from './xlsx-report/xlsx-report.module';
import { XlsxReportService } from './xlsx-report/xlsx-report.service';

const services = [
  SharedService,
  ProjectService,
  FileService,
  XlsxReportService,
];
@Module({
  providers: [...services],
  exports: [...services],
  imports: [ProjectModule, FileModule, XlsxWriterModule],
})
export class SharedModule {}
