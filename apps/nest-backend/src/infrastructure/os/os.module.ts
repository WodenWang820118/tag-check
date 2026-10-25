// module imports
import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { XlsxReportModule } from './xlsx-report/xlsx-report.module';
import { PathModule } from './path/path.module';
import { ProjectIoModule } from './project-io/project-io.module';
import { FolderModule } from './folder/folder.module';
import { RepositoryModule } from '../../core/repository/repository.module';

const modules = [
  PathModule,
  XlsxReportModule,
  FileModule,
  FolderModule,
  ProjectIoModule,
  RepositoryModule
];
/**
 * The data-access layer for features. It brings the infrastructure services
 * (paths, files, folders, spreadsheets, project import and export)
 * and re-exports RepositoryModule, so a feature module imports OsModule alone
 * rather than RepositoryModule or individual repository and infrastructure
 * modules.
 */
@Module({
  imports: [...modules],
  exports: [...modules]
})
export class OsModule {}
