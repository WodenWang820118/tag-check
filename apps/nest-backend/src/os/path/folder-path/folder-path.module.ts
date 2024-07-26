import { Module } from '@nestjs/common';
import { PathUtilsModule } from '../path-utils/path-utils.module';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from './folder-path.service';
import { ConfigurationModule } from '../../../configuration/configuration.module';
import { ConfigurationService } from '../../../configuration/configuration.service';

@Module({
  imports: [PathUtilsModule, ConfigurationModule],
  providers: [FolderPathService, PathUtilsService, ConfigurationService],
  exports: [FolderPathService, PathUtilsModule, ConfigurationModule],
})
export class FolderPathModule {}
