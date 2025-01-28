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
import { OldGA4EventsValidationStrategy } from './strategy/old-ga4-events-validation-strategy.service';
import { InspectorUtilsService } from './inspector-utils.service';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
import { TestImageService } from '../repository/test-report-facade/image-result.service';

const strategyService = {
  provide: STRATEGY_TYPE,
  useFactory: (
    ecommerceEventValidationStrategy: EcommerceEventValidationStrategy,
    oldGA4EventsValidationStrategy: OldGA4EventsValidationStrategy
  ) => {
    return {
      [ValidationStrategyType.ECOMMERCE]: ecommerceEventValidationStrategy,
      [ValidationStrategyType.OLDGA4EVENTS]: oldGA4EventsValidationStrategy
    };
  },
  inject: [EcommerceEventValidationStrategy, OldGA4EventsValidationStrategy]
};

const services = [
  InspectorGroupEventsService,
  InspectorSingleEventService,
  RequestProcessorService,
  strategyService,
  InspectorUtilsService,
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
  TestImageService
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
