import { Module } from '@nestjs/common';
import { FilePathModule } from './file-path/file-path.module';
import { FilePathService } from './file-path/file-path.service';
import { FolderPathService } from './folder-path/folder-path.service';
import { FolderPathModule } from './folder-path/folder-path.module';
import { ConfigurationModule } from '../../configuration/configuration.module';
import { ConfigurationService } from '../../configuration/configuration.service';

const modules = [FilePathModule, FolderPathModule, ConfigurationModule];
const services = [FilePathService, FolderPathService, ConfigurationService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class PathModule {}
