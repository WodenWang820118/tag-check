import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../../../configuration/configuration.module';
import { PathUtilsService } from './path-utils.service';
@Module({
  imports: [ConfigurationModule],
  providers: [PathUtilsService],
  exports: [PathUtilsService],
})
export class PathUtilsModule {}
