import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { FilePathService } from './file-path.service';
import { FolderPathModule } from '../folder-path/folder-path.module';

const modules = [FolderPathModule, PathUtilsModule];

@Module({
  imports: [...modules],
  providers: [FilePathService],
  exports: [FilePathService, ...modules]
})
export class FilePathModule {}
