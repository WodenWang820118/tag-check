import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { ProjectService } from './project/project.service';
import { FileModule } from './file/file.module';
import { FileService } from './file/file.service';
import { XlsxReportModule } from './xlsx-report/xlsx-report.module';
import { XlsxReportGroupEventsService } from './xlsx-report/xlsx-report-group-events.service';
import { ConfigurationModule } from '../configuration/configuration.module';
import { PathModule } from './path/path.module';
import { ProjectInitializationModule } from './project-initialization/project-initialization.module';
import { ProjectInitializationService } from './project-initialization/project-initialization.service';
import { FolderModule } from './folder/folder.module';
import { FolderService } from './folder/folder.service';
import { AbstractReportModule } from './abstract-report/abstract-report.module';
import { AbstractReportService } from './abstract-report/abstract-report.service';
import { ImageModule } from './image/image.module';
import { ImageService } from './image/image.service';

const modules = [
  PathModule,
  XlsxReportModule,
  ProjectModule,
  FileModule,
  ProjectInitializationModule,
  FolderModule,
  ConfigurationModule,
  AbstractReportModule,
  ImageModule,
];

const services = [
  ProjectService,
  FileService,
  XlsxReportGroupEventsService,
  ProjectInitializationService,
  FolderService,
  AbstractReportService,
  ImageService,
];
@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class OsModule {}
