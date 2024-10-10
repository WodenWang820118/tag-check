import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FilePathService } from './file-path.service';
import { FolderPathModule } from '../folder-path/folder-path.module';
import { FolderPathService } from '../folder-path/folder-path.service';

const modules = [FolderPathModule, PathUtilsModule];
const services = [FilePathService, PathUtilsService, FolderPathService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services],
})
export class FilePathModule {}
