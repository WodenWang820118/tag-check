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
import { ProjectXlsxRportModule } from './project-xlsx-report/project-xlsx-report.module';

// services
import { ProjectAbstractReportService } from './project-abstract-report/project-abstract-report.service';
import { ProjectInitializationService } from './project-initialization/project-initialization.service';
import { ProjectIoFacadeService } from './project-io-facade/project-io-facade.service';
import { ProjectMetadataService } from './project-metadata/project-metadata.service';
import { ProjectRecordingService } from './project-recording/project-recording.service';
import { ProjectReportService } from './project-report/project-report.service';
import { ProjectSettingService } from './project-setting/project-setting.service';
import { ProjectSpecService } from './project-spec/project-spec.service';
import { ProjectXlsxReportService } from './project-xlsx-report/project-xlsx-report.service';

const modules = [
  ProjectMetadataModule,
  ProjectRecordingModule,
  ProjectReportModule,
  ProjectSettingModule,
  ProjectSpecModule,
  ProjectInitializationModule,
  ProjectIoFacadeModule,
  ProjectAbstractReportModule,
  ProjectXlsxRportModule,
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
  ProjectXlsxReportService,
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services],
})
export class ProjectAgentModule {}
