import { Module } from '@nestjs/common';

// other modules
import { FileModule } from '../shared/file/file.module';
import { SharedModule } from '../shared/shared.module';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { GcsMonitorModule } from '../gcs-monitor/gcs-monitor.module';

// controllers
import { WaiterController } from './waiter-project.controller';
import { WaiterQaController } from './waiter-qa.controller';
import { WaiterDataLayerController } from './waiter-datalayer.controller';
import { WaiterGtmOperatorController } from './waiter-gtm-operator.controller';

// services
import { WaiterService } from './waiter.service';
import { SharedService } from '../shared/shared.service';
import { FileService } from '../shared/file/file.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { InspectorService } from '../inspector/inspector.service';
import { ActionService } from '../web-agent/action/action.service';
import { WebMonitoringService } from '../web-agent/web-monitoring/web-monitoring.service';
import { RequestProcessorService } from '../inspector/request-processor/request-processor.service';
import { UtilitiesService } from '../web-agent/utilities/utilities.service';
import { ProjectService } from '../shared/project/project.service';
import { XlsxReportService } from '../shared/xlsx-report/xlsx-report.service';
import { DataLayerService } from '../web-agent/web-monitoring/data-layer/data-layer.service';
import { RequestService } from '../web-agent/web-monitoring/request/request.service';

// services: action handlers
import { ChangeHandler } from '../web-agent/action/handlers/change-handler.service';
import { ClickHandler } from '../web-agent/action/handlers/click-handler.service';
import { HoverHandler } from '../web-agent/action/handlers/hover-handler.service';

// services: action strategies
import { RequestInterceptor } from '../web-agent/action/request-interceptor';
import { ClickStrategyService } from '../web-agent/action/strategies/click-strategies/click-strategy.service';
import { EvaluateClickService } from '../web-agent/action/strategies/click-strategies/evaluate-click.service';
import { PageClickService } from '../web-agent/action/strategies/click-strategies/page-click.service';
import { ChangeStrategyService } from '../web-agent/action/strategies/change-strategies/change-strategy.service';
import { EvaluateChangeService } from '../web-agent/action/strategies/change-strategies/evaluate-change.service';
import { PageChangeService } from '../web-agent/action/strategies/change-strategies/page-change.service';
import { HoverStrategyService } from '../web-agent/action/strategies/hover-strategies/hover-strategy.service';
import { PageHoverService } from '../web-agent/action/strategies/hover-strategies/page-hover.service';
import { EvaluateHoverService } from '../web-agent/action/strategies/hover-strategies/evaluate-hover.service';

const inspectorServices = [InspectorService, RequestProcessorService];

const webAgentServices = [
  WebAgentService,
  ActionService,
  WebMonitoringService,
  UtilitiesService,
  DataLayerService,
  RequestService,
];

const sharedServices = [
  FileService,
  SharedService,
  ProjectService,
  XlsxReportService,
];

const handlers = [ChangeHandler, ClickHandler, HoverHandler];

const operationStrategies = [
  EvaluateClickService,
  PageClickService,
  EvaluateChangeService,
  PageChangeService,
  EvaluateHoverService,
  PageHoverService,
];

@Module({
  imports: [
    SharedModule,
    FileModule,
    WebAgentModule,
    InspectorModule,
    GtmOperatorModule,
    GcsMonitorModule,
  ],
  controllers: [
    WaiterController,
    WaiterQaController,
    WaiterDataLayerController,
    WaiterGtmOperatorController,
  ],
  providers: [
    ...inspectorServices,
    ...webAgentServices,
    ...sharedServices,
    ...handlers,
    RequestInterceptor,
    WaiterService,
    ClickStrategyService,
    ChangeStrategyService,
    HoverStrategyService,
    ...operationStrategies,
  ],
})
export class WaiterModule {}
