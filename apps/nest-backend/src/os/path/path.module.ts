import { Module } from '@nestjs/common';
import { FilePathModule } from './file-path/file-path.module';
import { FilePathService } from './file-path/file-path.service';
import { FolderPathService } from './folder-path/folder-path.service';
import { FolderPathModule } from './folder-path/folder-path.module';

const modules = [FilePathModule, FolderPathModule];
const services = [FilePathService, FolderPathService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class PathModule {}
