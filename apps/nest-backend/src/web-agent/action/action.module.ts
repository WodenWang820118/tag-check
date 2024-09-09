import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { WebMonitoringModule } from '../action/web-monitoring/web-monitoring.module';
import { HandlerModule } from './handlers/handler.module';
import { EventsGatewayModule } from '../../events-gateway/events-gateway.module';
import { StepExecutorModule } from './step-executor/step-executor.module';
import { RequestInterceptorModule } from './request-interceptor/request-interceptor.module';
import { EventsGatewayService } from '../../events-gateway/events-gateway.service';
import { StepExecutorUtilsService } from './step-executor/step-executor-utils.service';
import { RequestInterceptorService } from './request-interceptor/request-interceptor.service';

const modules = [
  WebMonitoringModule,
  EventsGatewayModule,
  StepExecutorModule,
  RequestInterceptorModule,
];

const services = [
  ActionService,
  RequestInterceptorService,
  EventsGatewayService,
  StepExecutorUtilsService,
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules],
})
export class ActionModule {}
