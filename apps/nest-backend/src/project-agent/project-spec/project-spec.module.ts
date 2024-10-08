import { Module } from '@nestjs/common';
import { OsModule } from '../../os/os.module';
import { ProjectSpecService } from './project-spec.service';

@Module({
  imports: [OsModule],
  providers: [ProjectSpecService],
  exports: [ProjectSpecService, OsModule],
})
export class ProjectSpecModule {}
