import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { ProjectIoFacadeService } from './project-io-facade.service';

@Module({
  imports: [OsModule],
  providers: [ProjectIoFacadeService],
  exports: [ProjectIoFacadeService, OsModule]
})
export class ProjectIoFacadeModule {}
