import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectRecordingService } from './project-recording.service';

@Module({
  imports: [OsModule],
  providers: [ProjectRecordingService],
  exports: [ProjectRecordingService, OsModule]
})
export class ProjectRecordingModule {}
