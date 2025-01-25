import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { ProjectVideoService } from './project-video.service';

@Module({
  imports: [OsModule],
  providers: [ProjectVideoService],
  exports: [OsModule, ProjectVideoService]
})
export class ProjectVideoModule {}
