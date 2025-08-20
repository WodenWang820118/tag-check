import { Module } from '@nestjs/common';
import { InspectorGroupEventsService } from './inspector-group-events.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { RequestProcessorModule } from '../request-processor/request-processor.module';
import { RequestProcessorService } from '../request-processor/request-processor.service';
import { InspectorSingleEventService } from './inspector-single-event.service';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
import { DataLayerValidationStrategyModule } from './strategy/data-layer-validation-strategy.module';
import { STRATEGY_TYPE, ValidationStrategyType } from './utils';
import { EcommerceEventValidationStrategy } from './strategy/ecommerce-event-validation-strategy.service';
import { NonEcEventsValidationStrategy } from './strategy/non-ec-events-validation-strategy.service';
import { InspectorUtilsService } from './inspector-utils.service';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';

const strategyService = {
  provide: STRATEGY_TYPE,
  useFactory: (
    ecommerceEventValidationStrategy: EcommerceEventValidationStrategy,
    nonEcEventsValidationStrategy: NonEcEventsValidationStrategy
  ) => {
    return {
      [ValidationStrategyType.ECOMMERCE]: ecommerceEventValidationStrategy,
      [ValidationStrategyType.NONEC]: nonEcEventsValidationStrategy
    };
  },
  inject: [EcommerceEventValidationStrategy, NonEcEventsValidationStrategy]
};

const services = [
  InspectorGroupEventsService,
  InspectorSingleEventService,
  RequestProcessorService,
  strategyService,
  InspectorUtilsService,
  EcommerceEventValidationStrategy,
  NonEcEventsValidationStrategy,
  TestReportFacadeRepositoryService
];
@Module({
  imports: [
    WebAgentModule,
    RequestProcessorModule,
    ProjectAgentModule,
    DataLayerValidationStrategyModule,
    TestReportFacadeModule
  ],
  providers: [...services],
  exports: [...services, ProjectAgentModule]
})
export class InspectorModule {}
