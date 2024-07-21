import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PathModule } from '../path/path.module';
import { FileModule } from '../file/file.module';
import { FileService } from '../file/file.service';
import { FolderModule } from '../folder/folder.module';
import { FolderService } from '../folder/folder.service';

@Module({
  imports: [PathModule, FileModule, FolderModule],
  providers: [FileService, FolderService, ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
