import { Module } from '@nestjs/common';
import { ProjectInitializationService } from './project-initialization.service';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectFacadeRepositoryModule } from '../../repository/project-facade/project-facade-repository.module';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule, ProjectFacadeRepositoryModule],
  providers: [ProjectInitializationService],
  exports: [ProjectInitializationService, OsModule]
})
export class ProjectInitializationModule {}
