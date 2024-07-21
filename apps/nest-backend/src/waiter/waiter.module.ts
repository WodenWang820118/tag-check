import { Module } from '@nestjs/common';

// other modules
import { OsModule } from '../os/os.module';
import { ProjectMetadataModule } from '../project-metadata/project-metadata.module';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { EventInspectionModule } from './../event-inspection/event-inspection.module';

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
import { WaiterGtmOperatorService } from './gtm-operator/waiter-gtm-operator.service';
import { ProjectMetadataService } from '../project-metadata/project-metadata.service';
import { WaiterProjectWorkFlowService } from './project/waiter-project-workflow.service';
import { WaiterSpecService } from './spec/waiter-spec.service';
import { WaiterReportService } from './report/waiter-report.service';
import { WaiterRecordingService } from './recording/waiter-recording.service';
import { WaiterConfigurationService } from './configuration/waiter-configuration.service';
import { WaiterSettingsService } from './settings/waiter-settings.service';
import { WaiterProjectIoService } from './project-io/waiter-project-io.service';

const waiterServices = [
  WaiterEventInspectionService,
  WaiterGtmOperatorService,
  ProjectMetadataService,
  WaiterProjectWorkFlowService,
  WaiterSpecService,
  WaiterReportService,
  WaiterRecordingService,
  WaiterConfigurationService,
  WaiterSettingsService,
  WaiterProjectIoService,
];

@Module({
  imports: [
    ProjectMetadataModule,
    EventInspectionModule,
    OsModule,
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
