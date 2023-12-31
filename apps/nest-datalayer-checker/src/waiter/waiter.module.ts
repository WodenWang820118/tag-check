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
import { OsService } from '../os/os.service';
import { FileService } from '../os/file/file.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { InspectorService } from '../inspector/inspector.service';
import { ActionService } from '../web-agent/action/action.service';
import { WebMonitoringService } from '../web-agent/web-monitoring/web-monitoring.service';
import { RequestProcessorService } from '../inspector/request-processor/request-processor.service';
import { UtilitiesService } from '../web-agent/utilities/utilities.service';
import { ProjectService } from '../os/project/project.service';
import { XlsxReportService } from '../os/xlsx-report/xlsx-report.service';
import { DataLayerService } from '../web-agent/web-monitoring/data-layer/data-layer.service';
import { RequestService } from '../web-agent/web-monitoring/request/request.service';
import { ConfigurationService } from '../configuration/configuration.service';

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
import { SequelizeModule } from '@nestjs/sequelize';
import { Configuration } from '../configuration/entities/configuration.entity';

const waiterServices = [
  WaiterDataLayerService,
  WaiterGtmOperatorService,
  WaiterGtmSpecParserService,
  WaiterProjectService,
];

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
  OsService,
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
    OsModule,
    FileModule,
    WebAgentModule,
    InspectorModule,
    GtmOperatorModule,
    GcsMonitorModule,
    ConfigurationModule,
    SequelizeModule.forFeature([Configuration]),
  ],
  controllers: [
    WaiterProjectController,
    WaiterQaController,
    WaiterDataLayerController,
    WaiterGtmOperatorController,
    WaiterSpecParserController,
  ],
  providers: [
    ...waiterServices,
    ...inspectorServices,
    ...webAgentServices,
    ...sharedServices,
    ...handlers,
    RequestInterceptor,
    ClickStrategyService,
    ChangeStrategyService,
    HoverStrategyService,
    ...operationStrategies,
    ConfigurationService,
  ],
})
export class WaiterModule {}
