import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../../../configuration/configuration.module';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { PathUtilsService } from './path-utils.service';
@Module({
  imports: [ConfigurationModule],
  providers: [PathUtilsService, ConfigurationService],
  exports: [PathUtilsService, ConfigurationModule, ConfigurationService],
})
export class PathUtilsModule {}
