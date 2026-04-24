import { Module } from '@nestjs/common';
import { ExampleProjectRepositoryService } from './example-project-repository.service';
import { RepositoryModule } from '../../core/repository/repository.module';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
import { ProjectInitializationService } from '../project-agent/project-initialization/project-initialization.service';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';

const modules = [RepositoryModule, ProjectAgentModule, TestReportFacadeModule];
const services = [ProjectInitializationService];

@Module({
  imports: [...modules],
  providers: [
    ExampleProjectRepositoryService,
    ExampleEventsBuilderService,
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
