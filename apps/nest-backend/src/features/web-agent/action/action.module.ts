import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { DataLayerModule } from './web-monitoring/data-layer/data-layer.module';
import { EventsGatewayModule } from '../../../core/events-gateway/events-gateway.module';
import { StepExecutorModule } from './step-executor/step-executor.module';
import { RequestInterceptorService } from './request-interceptor/request-interceptor.service';
import { Ga4RequestMatcher } from './request-interceptor/ga4-request-matcher.service';

const modules = [DataLayerModule, EventsGatewayModule, StepExecutorModule];

const services = [ActionService, RequestInterceptorService, Ga4RequestMatcher];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ActionModule {}
