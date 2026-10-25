import { Module } from '@nestjs/common';
import { SysConfigurationRepositoryModule } from './sys-configuration/sys-configuration-repository.module';
import { TestEventRepositoryModule } from './test-event/test-event-repository.module';
import { SettingRepositoryModule } from './settings/setting-repositoy.module';
import { ProjectRepositoryModule } from './project/project-repository.module';
import { RecordingRepositoryModule } from './recording/recording-repository.module';
import { SpecRepositoryModule } from './spec/spec-repository.module';
import { ItemDefRepositoryModule } from './item-def/item-def-repository.module';
import { BatchRunRepositoryModule } from './batch-run/batch-run-repository.module';
import { ScheduleRepositoryModule } from './schedule/schedule-repository.module';

const modules = [
  BatchRunRepositoryModule,
  ScheduleRepositoryModule,
  ProjectRepositoryModule,
  RecordingRepositoryModule,
  SettingRepositoryModule,
  SpecRepositoryModule,
  SysConfigurationRepositoryModule,
  TestEventRepositoryModule,
  ItemDefRepositoryModule
];

/**
 * Gathers every repository module. Features reach it through OsModule, which
 * re-exports it; infrastructure modules that read configuration or images
 * import it directly.
 */
@Module({
  imports: modules,
  exports: modules
})
export class RepositoryModule {}
