import { Module } from '@nestjs/common';
import { ProjectInitializationService } from './project-initialization.service';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { OsModule } from '../../infrastructure/os/os.module';

@Module({
  imports: [OsModule],
  providers: [ProjectInitializationService, FolderService, FileService],
  exports: [ProjectInitializationService, OsModule]
})
export class ProjectInitializationModule {}
