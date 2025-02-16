import { Module } from '@nestjs/common';
import { SysConfigurationRepositoryService } from '../../../../core/repository/sys-configuration/sys-configuration-repository.service';
import { PathUtilsService } from './path-utils.service';
import { ConfigsModule } from '../../../../core/configs/configs.module';
import { RepositoryModule } from '../../../../core/repository/repository.module';
@Module({
  imports: [ConfigsModule, RepositoryModule],
  providers: [PathUtilsService, SysConfigurationRepositoryService],
  exports: [PathUtilsService, ConfigsModule]
})
export class PathUtilsModule {}
