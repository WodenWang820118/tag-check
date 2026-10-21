import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectGtmContainerService } from './project-gtm-container.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectGtmContainerService],
  exports: [ProjectGtmContainerService]
})
export class ProjectGtmContainerModule {}
