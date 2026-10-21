import { Module } from '@nestjs/common';
import { ProjectEventsBuilderService } from './project-events-builder.service';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectReportModule } from '../project-report/project-report.module';
import { ProjectRecordingModule } from '../project-recording/project-recording.module';
import { ProjectDataLayerSpecBuilderModule } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.module';
import { ProjectDataLayerSpecBuilderService } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.service';
import { ProjectGtmContainerModule } from '../project-gtm-container/project-gtm-container.module';
import { TestReportFacadeModule } from '../../repository/test-report-facade/test-report-facade.module';
@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [
    OsModule,
    ProjectReportModule,
    ProjectRecordingModule,
    ProjectDataLayerSpecBuilderModule,
    ProjectGtmContainerModule,
    TestReportFacadeModule
  ],
  providers: [ProjectEventsBuilderService, ProjectDataLayerSpecBuilderService],
  exports: [
    ProjectEventsBuilderService,
    ProjectDataLayerSpecBuilderService,
    ProjectGtmContainerModule
  ]
})
export class ProjectEventsBuilderModule {}
