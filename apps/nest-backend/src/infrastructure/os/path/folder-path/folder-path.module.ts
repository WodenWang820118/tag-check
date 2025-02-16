import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from './folder-path.service';
import { RepositoryModule } from '../../../../core/repository/repository.module';

@Module({
  imports: [PathUtilsModule, RepositoryModule],
  providers: [FolderPathService, PathUtilsService],
  exports: [FolderPathService, PathUtilsModule, RepositoryModule]
})
export class FolderPathModule {}
