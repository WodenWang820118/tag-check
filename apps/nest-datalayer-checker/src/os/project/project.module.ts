import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ConfigurationModule } from '../../configuration/configuration.module';

@Module({
  imports: [ConfigurationModule],
  providers: [ProjectService],
})
export class ProjectModule {}
