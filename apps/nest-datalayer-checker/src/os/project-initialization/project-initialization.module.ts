import { Module } from '@nestjs/common';
import { ProjectInitializationService } from './project-initialization.service';
import { PathModule } from '../path/path.module';
import { FolderModule } from '../folder/folder.module';
import { FolderService } from '../folder/folder.service';
import { FileModule } from '../file/file.module';
import { FileService } from '../file/file.service';

@Module({
  imports: [PathModule, FolderModule, FileModule],
  providers: [ProjectInitializationService, FolderService, FileService],
  exports: [ProjectInitializationService],
})
export class ProjectInitializationModule {}
