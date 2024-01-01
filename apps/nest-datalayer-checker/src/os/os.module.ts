import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { ProjectService } from './project/project.service';
import { FileModule } from './file/file.module';
import { FileService } from './file/file.service';
import { XlsxReportModule } from './xlsx-report/xlsx-report.module';
import { XlsxReportService } from './xlsx-report/xlsx-report.service';
import { ConfigurationModule } from '../configuration/configuration.module';
import { PathModule } from './path/path.module';
import { ProjectInitializationModule } from './project-initialization/project-initialization.module';
import { ProjectInitializationService } from './project-initialization/project-initialization.service';
import { FolderModule } from './folder/folder.module';
import { FolderService } from './folder/folder.service';

const modules = [
  PathModule,
  XlsxReportModule,
  ProjectModule,
  FileModule,
  ProjectInitializationModule,
  FolderModule,
  ConfigurationModule,
];

const services = [
  ProjectService,
  FileService,
  XlsxReportService,
  ProjectInitializationService,
  FolderService,
];
@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class OsModule {}
