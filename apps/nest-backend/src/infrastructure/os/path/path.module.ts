import { Module } from '@nestjs/common';
import { FilePathModule } from './file-path/file-path.module';
import { FolderPathModule } from './folder-path/folder-path.module';
import { RepositoryModule } from '../../../core/repository/repository.module';

const modules = [FilePathModule, FolderPathModule, RepositoryModule];

@Module({
  imports: [...modules],
  exports: [...modules]
})
export class PathModule {}
