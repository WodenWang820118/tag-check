import { Module } from '@nestjs/common';
import { ProjectInitializationService } from './project-initialization.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectFacadeRepositoryService } from '../../repository/project-facade/project-facade-repository.service';

@Module({
  imports: [OsModule],
  providers: [
    ProjectInitializationService,
    FolderService,
    FileService,
    ProjectFacadeRepositoryService
  ],
  exports: [ProjectInitializationService, OsModule]
})
export class ProjectInitializationModule {}
