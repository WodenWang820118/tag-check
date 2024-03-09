import { Module } from '@nestjs/common';

// other modules
import { FileModule } from '../os/file/file.module';
import { OsModule } from '../os/os.module';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { GcsMonitorModule } from '../gcs-monitor/gcs-monitor.module';
import { ConfigurationModule } from '../configuration/configuration.module';

// controllers
import { WaiterProjectWorkFlowController } from './project/waiter-project-workflow.controller';
import { WaiterProjectDataRetrievalController } from './project/waiter-project-data-retrieval.controller';
import { WaiterRecordingController } from './recording/waiter-recording.controller';
import { WaiterSpecController } from './spec/waiter-spec.controller';
import { WaiterReportController } from './report/waiter-report.controller';
import { WaiterQaController } from './qa/waiter-qa.controller';
import { WaiterDataLayerController } from './datalayer/waiter-datalayer.controller';
import { WaiterGtmOperatorController } from './gtm-operator/waiter-gtm-operator.controller';
import { WaiterSpecParserController } from './spec-parser/waiter-gtm-spec-parser.controller';
import { WaiterConfigurationController } from './configuration/waiter-configuration.controller';
import { WaiterSettingsController } from './settings/waiter-settings.controller';
import { WaiterProjectIoController } from './project-io/waiter-project-io.controller';

// services
import { WaiterDataLayerGroupEventsService } from './datalayer/waiter-datalayer-group-events.service';
import { WaiterDataLayerSingleEventService } from './datalayer/waiter-datalayer-single-event.service';
import { WaiterGtmOperatorService } from './gtm-operator/waiter-gtm-operator.service';
import { WaiterGtmSpecParserService } from './spec-parser/waiter-gtm-spec-parser.service';
import { WaiterProjectDataRetrievalService } from './project/waiter-project-data-retrieval.service';
import { WaiterProjectWorkFlowService } from './project/waiter-project-workflow.service';
import { WaiterSpecService } from './spec/waiter-spec.service';
import { WaiterReportService } from './report/waiter-report.service';
import { WaiterRecordingService } from './recording/waiter-recording.service';
import { WaiterQaService } from './qa/waiter-qa.service';
import { WaiterConfigurationService } from './configuration/waiter-configuration.service';
import { WaiterSettingsService } from './settings/waiter-settings.service';
import { WaiterProjectIoService } from './project-io/waiter-project-io.service';

const waiterServices = [
  WaiterDataLayerGroupEventsService,
  WaiterDataLayerSingleEventService,
  WaiterGtmOperatorService,
  WaiterGtmSpecParserService,
  WaiterProjectDataRetrievalService,
  WaiterProjectWorkFlowService,
  WaiterSpecService,
  WaiterReportService,
  WaiterRecordingService,
  WaiterQaService,
  WaiterConfigurationService,
  WaiterSettingsService,
  WaiterProjectIoService,
];

@Module({
  imports: [
    OsModule,
    FileModule,
    WebAgentModule,
    InspectorModule,
    GtmOperatorModule,
    GcsMonitorModule,
    ConfigurationModule,
  ],
  controllers: [
    WaiterProjectWorkFlowController,
    WaiterProjectDataRetrievalController,
    WaiterQaController,
    WaiterDataLayerController,
    WaiterGtmOperatorController,
    WaiterSpecParserController,
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
