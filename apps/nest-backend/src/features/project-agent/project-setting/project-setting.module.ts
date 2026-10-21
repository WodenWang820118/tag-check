import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectSettingService } from './project-setting.service';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [ProjectSettingService],
  exports: [ProjectSettingService, OsModule]
})
export class ProjectSettingModule {}
