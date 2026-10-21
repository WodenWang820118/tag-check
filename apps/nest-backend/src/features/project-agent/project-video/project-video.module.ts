import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectVideoService } from './project-video.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectVideoService],
  exports: [OsModule, ProjectVideoService]
})
export class ProjectVideoModule {}
