import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { FolderPathService } from './folder-path.service';
import { RepositoryModule } from '../../../../core/repository/repository.module';

@Module({
  imports: [PathUtilsModule, RepositoryModule],
  providers: [FolderPathService],
  exports: [FolderPathService, PathUtilsModule, RepositoryModule]
})
export class FolderPathModule {}
