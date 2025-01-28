// module imports
import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { FileModule } from './file/file.module';
import { XlsxReportModule } from './xlsx-report/xlsx-report.module';
import { PathModule } from './path/path.module';
import { ProjectIoModule } from './project-io/project-io.module';
import { FolderModule } from './folder/folder.module';
import { ImageModule } from './image/image.module';
import { TestReportFacadeModule } from '../../features/repository/test-report-facade/test-report-facade.module';

// services
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';
import { ProjectIoService } from './project-io/project-io.service';
import { FolderService } from './folder/folder.service';
import { ImageService } from './image/image.service';
import { TestImageService } from '../../features/repository/test-report-facade/image-result.service';

const modules = [
  PathModule,
  XlsxReportModule,
  ProjectModule,
  FileModule,
  FolderModule,
  ImageModule,
  ProjectIoModule,
  TestReportFacadeModule
];

const services = [
  ProjectService,
  FileService,
  FolderService,
  ImageService,
  ProjectIoService,
  TestImageService
];
@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services]
})
export class OsModule {}
