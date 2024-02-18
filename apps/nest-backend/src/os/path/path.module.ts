import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../../configuration/configuration.module';
import { ConfigurationService } from '../../configuration/configuration.service';
import { PathUtilsModule } from './path-utils/path-utils.module';
import { PathUtilsService } from './path-utils/path-utils.service';
import { FilePathModule } from './file-path/file-path.module';
import { FilePathService } from './file-path/file-path.service';
import { FolderModule } from '../folder/folder.module';
import { FolderService } from '../folder/folder.service';
import { FolderPathModule } from './folder-path/folder-path.module';
import { FolderPathService } from './folder-path/folder-path.service';

const modules = [
  ConfigurationModule,
  PathUtilsModule,
  FilePathModule,
  FolderPathModule,
  FolderModule,
];

const services = [
  ConfigurationService,
  PathUtilsService,
  FilePathService,
  FolderPathService,
  FolderService,
];

@Module({
  imports: [ConfigurationModule, ...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class PathModule {}
