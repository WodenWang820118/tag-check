import { Module } from '@nestjs/common';

// modules
import { ProjectAbstractReportModule } from './project-abstract-report/project-abstract-report.module';
import { ProjectInitializationModule } from './project-initialization/project-initialization.module';
import { ProjectIoFacadeModule } from './project-io-facade/project-io-facade.module';
import { ProjectRecordingModule } from './project-recording/project-recording.module';
import { ProjectReportModule } from './project-report/project-report.module';
import { ProjectSpecModule } from './project-spec/project-spec.module';
import { ProjectFileReportModule } from './project-file-report/project-file-report.module';
import { ProjectVideoModule } from './project-video/project-video.module';
import { ProjectFacadeRepositoryModule } from '../repository/project-facade/project-facade-repository.module';
import { ProjectDataLayerSpecBuilderModule } from './project-data-layer-spec-builder/project-data-layer-spec.builder.module';
import { ProjectGtmContainerModule } from './project-gtm-container/project-gtm-container.module';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
import { ProjectEventsBuilderModule } from './project-events-builder/project-events-builder.module';

const modules = [
  ProjectFacadeRepositoryModule,
  ProjectRecordingModule,
  ProjectReportModule,
  ProjectSpecModule,
  ProjectInitializationModule,
  ProjectIoFacadeModule,
  ProjectAbstractReportModule,
  ProjectFileReportModule,
  ProjectVideoModule,
  ProjectDataLayerSpecBuilderModule,
  ProjectGtmContainerModule,
  ProjectEventsBuilderModule,
  TestReportFacadeModule
];

/** The project features together; each service comes from its own module. */
@Module({
  imports: [...modules],
  exports: [...modules]
})
export class ProjectAgentModule {}
