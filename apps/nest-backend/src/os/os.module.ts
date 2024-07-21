// module imports
import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { FileModule } from './file/file.module';
import { XlsxReportModule } from './xlsx-report/xlsx-report.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { PathModule } from './path/path.module';
import { ProjectIoModule } from './project-io/project-io.module';
import { FolderModule } from './folder/folder.module';
import { ImageModule } from './image/image.module';

// services
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';
import { XlsxReportGroupEventsService } from './xlsx-report/xlsx-report-group-events.service';
import { ProjectIoService } from './project-io/project-io.service';
import { FolderService } from './folder/folder.service';
import { ImageService } from './image/image.service';

const modules = [
  PathModule,
  XlsxReportModule,
  ProjectModule,
  FileModule,
  FolderModule,
  ConfigurationModule,
  ImageModule,
  ProjectIoModule,
];

const services = [
  ProjectService,
  FileService,
  XlsxReportGroupEventsService,
  FolderService,
  ImageService,
  ProjectIoService,
];
@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class OsModule {}
