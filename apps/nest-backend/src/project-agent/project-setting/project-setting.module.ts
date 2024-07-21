import { Module } from '@nestjs/common';
import { OsModule } from '../../os/os.module';
import { ProjectSettingService } from './project-setting.service';

@Module({
  imports: [OsModule],
  providers: [ProjectSettingService],
  exports: [ProjectSettingService, OsModule],
})
export class ProjectSettingModule {}
