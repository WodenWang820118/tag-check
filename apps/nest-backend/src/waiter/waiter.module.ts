import { Module } from '@nestjs/common';

// other modules
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { EventInspectionModule } from './../event-inspection/event-inspection.module';
import { ProjectAgentModule } from '../project-agent/project-agent.module';

// controllers
import { WaiterProjectWorkFlowController } from './project/waiter-project-workflow.controller';
import { WaiterProjectDataRetrievalController } from './project/waiter-project-data-retrieval.controller';
import { WaiterRecordingController } from './recording/waiter-recording.controller';
import { WaiterSpecController } from './spec/waiter-spec.controller';
import { WaiterReportController } from './report/waiter-report.controller';
import { WaiterDataLayerController } from './datalayer/waiter-datalayer.controller';
import { WaiterGtmOperatorController } from './gtm-operator/waiter-gtm-operator.controller';
import { WaiterConfigurationController } from './configuration/waiter-configuration.controller';
import { WaiterSettingsController } from './settings/waiter-settings.controller';
import { WaiterProjectIoController } from './project-io/waiter-project-io.controller';

// services
import { WaiterEventInspectionService } from './datalayer/waiter-event-inspection.service';
import { ProjectMetadataService } from '../project-agent/project-metadata/project-metadata.service';
import { WaiterProjectWorkFlowService } from './project/waiter-project-workflow.service';
import { WaiterConfigurationService } from './configuration/waiter-configuration.service';

const waiterServices = [
  WaiterEventInspectionService,
  ProjectMetadataService,
  WaiterProjectWorkFlowService,
  WaiterConfigurationService,
];

@Module({
  imports: [
    ProjectAgentModule,
    EventInspectionModule,
    GtmOperatorModule,
    ConfigurationModule,
  ],
  controllers: [
    WaiterProjectWorkFlowController,
    WaiterProjectDataRetrievalController,
    WaiterDataLayerController,
    WaiterGtmOperatorController,
    WaiterRecordingController,
    WaiterSpecController,
    WaiterReportController,
    WaiterConfigurationController,
    WaiterSettingsController,
    WaiterProjectIoController,
  ],
  providers: [...waiterServices],
})
export class WaiterModule {}
