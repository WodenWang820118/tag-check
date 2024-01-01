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
import { WaiterProjectController } from './waiter-project.controller';
import { WaiterQaController } from './waiter-qa.controller';
import { WaiterDataLayerController } from './waiter-datalayer.controller';
import { WaiterGtmOperatorController } from './waiter-gtm-operator.controller';
import { WaiterSpecParserController } from './waiter-gtm-spec-parser.controller';

// services
import { WaiterDataLayerService } from './waiter-datalayer.service';
import { WaiterGtmOperatorService } from './waiter-gtm-operator.service';
import { WaiterGtmSpecParserService } from './waiter-gtm-spec-parser.service';
import { WaiterProjectService } from './waiter-project.service';

const waiterServices = [
  WaiterDataLayerService,
  WaiterGtmOperatorService,
  WaiterGtmSpecParserService,
  WaiterProjectService,
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
  ],
  providers: [...waiterServices],
})
export class WaiterModule {}
