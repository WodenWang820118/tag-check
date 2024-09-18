import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../../../configuration/configuration.module';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { PathUtilsService } from './path-utils.service';
import { ConfigsModule } from '../../../configs/configs.module';
@Module({
  imports: [ConfigurationModule, ConfigsModule],
  providers: [PathUtilsService, ConfigurationService],
  exports: [
    PathUtilsService,
    ConfigurationModule,
    ConfigurationService,
    ConfigsModule,
  ],
})
export class PathUtilsModule {}
