import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectMetadataService } from './project-metadata.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectMetadataService],
  exports: [ProjectMetadataService]
})
export class ProjectMetadataModule {}
