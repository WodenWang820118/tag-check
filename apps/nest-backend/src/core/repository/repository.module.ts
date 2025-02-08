import { Module } from '@nestjs/common';
import { SysConfigurationRepositoryModule } from './sys-configuration/sys-configuration-repository.module';
import { TestEventRepositoryModule } from './test-event/test-event-repository.module';
import { SettingRepositoryModule } from './settings/setting-repositoy.module';
import { ProjectRepositoryModule } from './project/project-repository.module';
import { RecordingRepositoryModule } from './recording/recording-repository.module';
import { SpecRepositoryModule } from './spec/spec-repository.module';
import { FileReportRepositoryModule } from './file-report/file-report-repository.module';

const modules = [
  ProjectRepositoryModule,
  RecordingRepositoryModule,
  SettingRepositoryModule,
  SpecRepositoryModule,
  SysConfigurationRepositoryModule,
  TestEventRepositoryModule,
  FileReportRepositoryModule
];

@Module({
  imports: modules,
  exports: modules
})
export class RepositoryModule {}
