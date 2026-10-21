import { Module } from '@nestjs/common';
import { ExampleProjectRepositoryService } from './example-project-repository.service';
import { OsModule } from '../../infrastructure/os/os.module';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
import { ProjectInitializationService } from '../project-agent/project-initialization/project-initialization.service';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { ExampleRecordingsRefreshService } from './example-recordings-refresh.service';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';

const modules = [OsModule, ProjectAgentModule, TestReportFacadeModule];
const services = [ProjectInitializationService];

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [...modules],
  providers: [
    ExampleProjectRepositoryService,
    ExampleEventsBuilderService,
    ExampleRecordingsRefreshService,
    ...services
  ],
  exports: [
    ExampleProjectRepositoryService,
    ExampleEventsBuilderService,
    ...modules,
    ...services
  ]
})
export class ExampleProjectRepositoryModule {}
