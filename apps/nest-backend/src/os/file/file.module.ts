import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { ConfigurationModule } from '../../configuration/configuration.module';
import { ConfigurationService } from '../../configuration/configuration.service';
import { PathModule } from '../path/path.module';
import { FolderModule } from '../folder/folder.module';
import { FolderService } from '../folder/folder.service';

@Module({
  imports: [PathModule, FolderModule, ConfigurationModule],
  providers: [FileService, ConfigurationService, FolderService],
  exports: [FileService],
})
export class FileModule {}
