import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectDataExportModule } from '../../../infrastructure/data-export/project-data-export.module';
import { ProjectIoFacadeService } from './project-io-facade.service';

@Module({
  imports: [OsModule, ProjectDataExportModule],
  providers: [ProjectIoFacadeService],
  exports: [ProjectIoFacadeService, OsModule]
})
export class ProjectIoFacadeModule {}
