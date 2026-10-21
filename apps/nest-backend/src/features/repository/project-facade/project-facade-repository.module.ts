import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectFacadeRepositoryService } from './project-facade-repository.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectFacadeRepositoryService],
  exports: [ProjectFacadeRepositoryService]
})
export class ProjectFacadeRepositoryModule {}
