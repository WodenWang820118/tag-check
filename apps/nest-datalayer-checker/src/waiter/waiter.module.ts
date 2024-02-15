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
import { WaiterProjectController } from './project/waiter-project.controller';
import { WaiterRecordingController } from './recording/waiter-recording.controller';
import { WaiterSpecController } from './spec/waiter-spec.controller';
import { WaiterReportController } from './report/waiter-report.controller';
import { WaiterQaController } from './qa/waiter-qa.controller';
import { WaiterDataLayerController } from './datalayer/waiter-datalayer.controller';
import { WaiterGtmOperatorController } from './gtm-operator/waiter-gtm-operator.controller';
import { WaiterSpecParserController } from './spec-parser/waiter-gtm-spec-parser.controller';
import { WaiterConfigurationController } from './configuration/waiter-configuration.controller';

// services
import { WaiterDataLayerService } from './datalayer/waiter-datalayer.service';
import { WaiterGtmOperatorService } from './gtm-operator/waiter-gtm-operator.service';
import { WaiterGtmSpecParserService } from './spec-parser/waiter-gtm-spec-parser.service';
import { WaiterProjectService } from './project/waiter-project.service';
import { WaiterSpecService } from './spec/waiter-spec.service';
import { WaiterReportService } from './report/waiter-report.service';
import { WaiterRecordingService } from './recording/waiter-recording.service';
import { WaiterQaService } from './qa/waiter-qa.service';
import { WaiterConfigurationService } from './configuration/waiter-configuration.service';

const waiterServices = [
  WaiterDataLayerService,
  WaiterGtmOperatorService,
  WaiterGtmSpecParserService,
  WaiterProjectService,
  WaiterSpecService,
  WaiterReportService,
  WaiterRecordingService,
  WaiterQaService,
  WaiterConfigurationService,
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
    WaiterProjectController,
    WaiterQaController,
    WaiterDataLayerController,
    WaiterGtmOperatorController,
    WaiterSpecParserController,
    WaiterRecordingController,
    WaiterSpecController,
    WaiterReportController,
    WaiterConfigurationController,
  ],
  providers: [...waiterServices],
})
export class WaiterModule {}
