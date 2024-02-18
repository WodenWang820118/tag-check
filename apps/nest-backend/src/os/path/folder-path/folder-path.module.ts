import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from './folder-path.service';
import { ConfigurationModule } from '../../../configuration/configuration.module';

@Module({
  imports: [PathUtilsModule, ConfigurationModule],
  providers: [FolderPathService, PathUtilsService],
  exports: [FolderPathService],
})
export class FolderPathModule {}
