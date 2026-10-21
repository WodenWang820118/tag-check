import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectSpecService } from './project-spec.service';
import { SpecService } from './spec.service';

const services = [ProjectSpecService, SpecService];

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [...services],
  exports: [...services, OsModule]
})
export class ProjectSpecModule {}
