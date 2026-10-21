import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectImageService } from './project-image.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectImageService],
  exports: [ProjectImageService]
})
export class ProjectImageModule {}
