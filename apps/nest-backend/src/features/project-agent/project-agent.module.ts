import { Module } from '@nestjs/common';

// modules
import { ProjectAbstractReportModule } from './project-abstract-report/project-abstract-report.module';
import { ProjectInitializationModule } from './project-initialization/project-initialization.module';
import { ProjectIoFacadeModule } from './project-io-facade/project-io-facade.module';
import { ProjectMetadataModule } from './project-metadata/project-metadata.module';
import { ProjectRecordingModule } from './project-recording/project-recording.module';
import { ProjectReportModule } from './project-report/project-report.module';
import { ProjectSettingModule } from './project-setting/project-setting.module';
import { ProjectSpecModule } from './project-spec/project-spec.module';
import { ProjectFileReportModule } from './project-file-report/project-file-report.module';
import { ProjectVideoModule } from './project-video/project-video.module';
import { ProjectImageModule } from './project-image/project-image.module';
import { ProjectFacadeRepositoryModule } from '../repository/project-facade/project-facade-repository.module';
import { ProjectDataLayerSpecBuilderModule } from './project-data-layer-spec-builder/project-data-layer-spec.builder.module';

// services
import { ProjectAbstractReportService } from './project-abstract-report/project-abstract-report.service';
import { ProjectInitializationService } from './project-initialization/project-initialization.service';
import { ProjectIoFacadeService } from './project-io-facade/project-io-facade.service';
import { ProjectMetadataService } from './project-metadata/project-metadata.service';
import { ProjectRecordingService } from './project-recording/project-recording.service';
import { ProjectReportService } from './project-report/project-report.service';
import { ProjectSettingService } from './project-setting/project-setting.service';
import { ProjectSpecService } from './project-spec/project-spec.service';
import { ProjectImageService } from './project-image/project-image.service';
import { ProjectFileReportService } from './project-file-report/project-file-report.service';
import { ProjectVideoService } from './project-video/project-video.service';
import { ProjectEventsBuilderService } from './project-events-builder/project-events-builder.service';
import { ProjectDataLayerSpecBuilderService } from './project-data-layer-spec-builder/project-data-layer-spec.builder.service';

const modules = [
  ProjectFacadeRepositoryModule,
  ProjectMetadataModule,
  ProjectRecordingModule,
  ProjectReportModule,
  ProjectSettingModule,
  ProjectSpecModule,
  ProjectInitializationModule,
  ProjectIoFacadeModule,
  ProjectAbstractReportModule,
  ProjectImageModule,
  ProjectFileReportModule,
  ProjectVideoModule,
  ProjectDataLayerSpecBuilderModule
];

const services = [
  ProjectAbstractReportService,
  ProjectInitializationService,
  ProjectIoFacadeService,
  ProjectMetadataService,
  ProjectRecordingService,
  ProjectReportService,
  ProjectSettingService,
  ProjectSpecService,
  ProjectImageService,
  ProjectFileReportService,
  ProjectVideoService,
  ProjectEventsBuilderService,
  ProjectDataLayerSpecBuilderService
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services]
})
export class ProjectAgentModule {}
