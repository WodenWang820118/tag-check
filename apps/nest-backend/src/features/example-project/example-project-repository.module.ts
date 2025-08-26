import { Module } from '@nestjs/common';
import { ExampleProjectRepositoryService } from './example-project-repository.service';
import { RepositoryModule } from '../../core/repository/repository.module';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
import { ProjectInitializationService } from '../project-agent/project-initialization/project-initialization.service';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { DataLayerSpecBuilderModule } from '../data-layer-spec-builder/data-layer-spec.builder.module';
import { DataLayerSpecBuilderService } from '../data-layer-spec-builder/data-layer-spec.builder.service';

const modules = [
  RepositoryModule,
  ProjectAgentModule,
  DataLayerSpecBuilderModule
];
const services = [
  TestReportFacadeRepositoryService,
  ProjectInitializationService,
  DataLayerSpecBuilderService
];

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
