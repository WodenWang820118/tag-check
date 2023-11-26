import { Module } from '@nestjs/common';

// other modules
import { FileModule } from '../shared/file/file.module';
import { SharedModule } from '../shared/shared.module';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { GcsMonitorModule } from '../gcs-monitor/gcs-monitor.module';

// controllers
import { WaiterController } from './waiter-path.controller';
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
import { AriaChangeStrategy } from '../web-agent/action/strategies/change-strategies/aria-change-strategy.service';
import { CSSChangeStrategy } from '../web-agent/action/strategies/change-strategies/css-change-strategy.service';
import { PierceChangeStrategy } from '../web-agent/action/strategies/change-strategies/pierce-change-strategy.service';
import { XpathChangeStrategy } from '../web-agent/action/strategies/change-strategies/xpath-change-strategy.service';
import { AriaClickStrategy } from '../web-agent/action/strategies/click-strategies/aria-click-strategy.service';
import { CSSClickStrategy } from '../web-agent/action/strategies/click-strategies/css-click-strategy.service';
import { PierceClickStrategy } from '../web-agent/action/strategies/click-strategies/pierce-click-strategy.service';
import { TextClickStrategy } from '../web-agent/action/strategies/click-strategies/text-click-strategy.service';
import { XPathClickStrategy } from '../web-agent/action/strategies/click-strategies/xpath-click-strategy.service';
import { AriaHoverStrategy } from '../web-agent/action/strategies/hover-strategies/aria-hover-strategy.service';
import { CSSHoverStrategy } from '../web-agent/action/strategies/hover-strategies/css-hover-strategy.service';
import { PierceHoverStrategy } from '../web-agent/action/strategies/hover-strategies/pierce-hover-strategy.service';
import { TextHoverStrategy } from '../web-agent/action/strategies/hover-strategies/text-hover-strategy.service';
import { XPathHoverStrategy } from '../web-agent/action/strategies/hover-strategies/xpath-hover-strategy.service';

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
const changeStrategies = [
  AriaChangeStrategy,
  CSSChangeStrategy,
  PierceChangeStrategy,
  XpathChangeStrategy,
];

const clickStrategies = [
  AriaClickStrategy,
  CSSClickStrategy,
  PierceClickStrategy,
  TextClickStrategy,
  XPathClickStrategy,
];

const hoverStrategies = [
  AriaHoverStrategy,
  CSSHoverStrategy,
  PierceHoverStrategy,
  TextHoverStrategy,
  XPathHoverStrategy,
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
    ...changeStrategies,
    ...clickStrategies,
    ...hoverStrategies,
    ...handlers,
    WaiterService,
  ],
})
export class WaiterModule {}
