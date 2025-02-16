import { Module } from '@nestjs/common';

// other modules
import { GtmOperatorModule } from '../infrastructure/gtm-operator/gtm-operator.module';
import { EventInspectionModule } from '../features/event-inspection/event-inspection.module';
import { ProjectAgentModule } from '../features/project-agent/project-agent.module';

// controllers
import { ProjectWorkFlowController } from './project/project-workflow.controller';
import { ProjectDataRetrievalController } from './project/project-data-retrieval.controller';
import { RecordingController } from './recording/recording.controller';
import { SpecController } from './spec/spec.controller';
import { ReportController } from './report/report.controller';
import { DataLayerController } from './data-layer/datalayer.controller';
import { GtmOperatorController } from './gtm-operator/gtm-operator.controller';
import { ConfigurationController } from './configuration/configuration.controller';
import { SettingsController } from './settings/settings.controller';
import { ProjectIoController } from './project-io/project-io.controller';
import { FileReportsController } from './file-reports/file-reports.controller';
import { VideosController } from './videos/videos.controller';

// services
import { EventInspectionControllerService } from './data-layer/event-inspection-controller.service';
import { ProjectWorkFlowControllerService } from './project/project-workflow-controller.service';
import { ConfigurationControllerService } from './configuration/configuration-controller.service';

const services = [
  EventInspectionControllerService,
  ProjectWorkFlowControllerService,
  ConfigurationControllerService
];

@Module({
  imports: [ProjectAgentModule, EventInspectionModule, GtmOperatorModule],
  controllers: [
    ProjectWorkFlowController,
    ProjectDataRetrievalController,
    DataLayerController,
    GtmOperatorController,
    RecordingController,
    SpecController,
    ReportController,
    ConfigurationController,
    SettingsController,
    ProjectIoController,
    FileReportsController,
    VideosController
  ],
  providers: [...services]
})
export class ControllerModule {}
