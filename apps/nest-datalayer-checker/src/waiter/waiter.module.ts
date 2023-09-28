import { Module } from '@nestjs/common';
import { WaiterController } from './waiter-path.controller';
import { WaiterQaController } from './waiter-qa.controller';
import { WaiterDataLayerController } from './waiter-datalayer.controller';

// other modules
import { FileModule } from '../shared/file/file.module';
import { SharedModule } from '../shared/shared.module';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';

// services
import { WaiterService } from './waiter.service';
import { SharedService } from '../shared/shared.service';
import { FileService } from '../shared/file/file.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { InspectorService } from '../inspector/inspector.service';
import { PuppeteerService } from '../web-agent/puppeteer/puppeteer.service';
import { ActionService } from '../web-agent/action/action.service';
import { WebMonitoringService } from '../web-agent/web-monitoring/web-monitoring.service';
import { RequestProcessorService } from '../inspector/request-processor/request-processor.service';
import { UtilitiesService } from '../web-agent/utilities/utilities.service';
import { ProjectService } from '../shared/project/project.service';
import { XlsxReportService } from '../shared/xlsx-report/xlsx-report.service';

const inspectorServices = [InspectorService, RequestProcessorService];

const webAgentServices = [
  WebAgentService,
  PuppeteerService,
  ActionService,
  WebMonitoringService,
  UtilitiesService,
];

const sharedServices = [
  FileService,
  SharedService,
  ProjectService,
  XlsxReportService,
];
@Module({
  imports: [SharedModule, FileModule, WebAgentModule, InspectorModule],
  controllers: [
    WaiterController,
    WaiterQaController,
    WaiterDataLayerController,
  ],
  providers: [
    ...inspectorServices,
    ...webAgentServices,
    ...sharedServices,
    WaiterService,
  ],
})
export class WaiterModule {}
