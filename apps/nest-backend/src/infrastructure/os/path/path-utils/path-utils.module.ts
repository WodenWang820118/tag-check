import { Module } from '@nestjs/common';
import { PathUtilsService } from './path-utils.service';
import { ConfigsModule } from '../../../../core/configs/configs.module';
import { RepositoryModule } from '../../../../core/repository/repository.module';
@Module({
  imports: [ConfigsModule, RepositoryModule],
  providers: [PathUtilsService],
  exports: [PathUtilsService, ConfigsModule]
})
export class PathUtilsModule {}
