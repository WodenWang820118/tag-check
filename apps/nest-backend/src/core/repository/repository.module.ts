import { Module } from '@nestjs/common';
import { SysConfigurationRepositoryModule } from './sys-configuration/sys-configuration-repository.module';
import { TestEventRepositoryModule } from './test/test-event-repository.module';
import { SettingRepositoryModule } from './settings/setting-repositoy.module';

const modules = [
  SysConfigurationRepositoryModule,
  TestEventRepositoryModule,
  SettingRepositoryModule
];

@Module({
  imports: modules,
  exports: modules
})
export class RepositoryModule {}
