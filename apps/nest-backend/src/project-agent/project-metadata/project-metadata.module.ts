import { Module } from '@nestjs/common';
import { OsModule } from '../../os/os.module';
import { ProjectMetadataService } from './project-metadata.service';

@Module({
  imports: [OsModule],
  providers: [ProjectMetadataService],
  exports: [ProjectMetadataService, OsModule],
})
export class ProjectMetadataModule {}
