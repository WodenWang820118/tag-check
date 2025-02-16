import { Module } from '@nestjs/common';
import { SysConfigurationRepositoryService } from './sys-configuration-repository.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysConfigurationEntity } from '../../../shared';
import { ConfigsModule } from '../../configs/configs.module';

const modules = [TypeOrmModule.forFeature([SysConfigurationEntity])];

@Module({
  imports: [ConfigsModule, ...modules],
  providers: [SysConfigurationRepositoryService],
  exports: [SysConfigurationRepositoryService, ...modules]
})
export class SysConfigurationRepositoryModule {}
