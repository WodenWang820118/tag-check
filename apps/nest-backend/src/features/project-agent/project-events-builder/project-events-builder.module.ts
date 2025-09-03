import { Module } from '@nestjs/common';
import { ProjectEventsBuilderService } from './project-events-builder.service';
import { RepositoryModule } from '../../../core/repository/repository.module';
import { ProjectReportModule } from '../project-report/project-report.module';
import { ProjectRecordingModule } from '../project-recording/project-recording.module';
import { ProjectDataLayerSpecBuilderModule } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.module';
import { ProjectDataLayerSpecBuilderService } from '../project-data-layer-spec-builder/project-data-layer-spec.builder.service';
@Module({
  imports: [
    RepositoryModule,
    ProjectReportModule,
    ProjectRecordingModule,
    ProjectDataLayerSpecBuilderModule
  ],
  providers: [ProjectEventsBuilderService, ProjectDataLayerSpecBuilderService],
  exports: [ProjectEventsBuilderService, ProjectDataLayerSpecBuilderService]
})
export class ProjectEventsBuilderModule {}
