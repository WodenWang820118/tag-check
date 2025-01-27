import { Module } from '@nestjs/common';
import { FilePathModule } from './file-path/file-path.module';
import { FilePathService } from './file-path/file-path.service';
import { FolderPathService } from './folder-path/folder-path.service';
import { FolderPathModule } from './folder-path/folder-path.module';
import { RepositoryModule } from '../../../core/repository/repository.module';

const modules = [FilePathModule, FolderPathModule, RepositoryModule];
const services = [FilePathService, FolderPathService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services]
})
export class PathModule {}
