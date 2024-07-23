import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from './folder-path.service';

@Module({
  imports: [PathUtilsModule],
  providers: [FolderPathService, PathUtilsService],
  exports: [FolderPathService],
})
export class FolderPathModule {}
