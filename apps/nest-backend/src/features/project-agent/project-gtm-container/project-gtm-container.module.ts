import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectGtmContainerService } from './project-gtm-container.service';

@Module({
  imports: [OsModule],
  providers: [ProjectGtmContainerService],
  exports: [ProjectGtmContainerService]
})
export class ProjectGtmContainerModule {}
