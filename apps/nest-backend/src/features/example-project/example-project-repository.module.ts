import { Module } from '@nestjs/common';
import { ExampleProjectRepositoryService } from './example-project-repository.service';
import { OsModule } from '../../infrastructure/os/os.module';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
import { ProjectInitializationModule } from '../project-agent/project-initialization/project-initialization.module';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { ExampleRecordingsRefreshService } from './example-recordings-refresh.service';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';

const modules = [
  OsModule,
  ProjectAgentModule,
  ProjectInitializationModule,
  TestReportFacadeModule
];

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [...modules],
  providers: [
    ExampleProjectRepositoryService,
    ExampleEventsBuilderService,
    ExampleRecordingsRefreshService
  ],
  exports: [
    ExampleProjectRepositoryService,
    ExampleEventsBuilderService,
    ...modules
  ]
})
export class ExampleProjectRepositoryModule {}
