import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectRecordingService } from './project-recording.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectRecordingService],
  exports: [ProjectRecordingService, OsModule]
})
export class ProjectRecordingModule {}
