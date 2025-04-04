import { Module } from '@nestjs/common';
import { ExampleProjectRepositoryService } from './example-project-repository.service';
import { RepositoryModule } from '../../core/repository/repository.module';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
import { ProjectInitializationService } from '../project-agent/project-initialization/project-initialization.service';

const modules = [RepositoryModule, ProjectAgentModule];
const services = [
  TestReportFacadeRepositoryService,
  ProjectInitializationService
];

@Module({
  imports: [...modules],
  providers: [ExampleProjectRepositoryService, ...services],
  exports: [ExampleProjectRepositoryService, ...modules, ...services]
})
export class ExampleProjectRepositoryModule {}
