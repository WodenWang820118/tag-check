import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectFacadeRepositoryService } from './project-facade-repository.service';

/** Provides project creation and settings updates across repositories. */
@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectFacadeRepositoryService],
  exports: [ProjectFacadeRepositoryService]
})
export class ProjectFacadeRepositoryModule {}
