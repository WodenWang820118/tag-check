import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { WebMonitoringModule } from '../action/web-monitoring/web-monitoring.module';
import { EventsGatewayModule } from '../../core/events-gateway/events-gateway.module';
import { StepExecutorModule } from './step-executor/step-executor.module';
import { EventsGatewayService } from '../../core/events-gateway/events-gateway.service';
import { StepExecutorUtilsService } from './step-executor/step-executor-utils.service';
import { RequestInterceptorService } from './request-interceptor/request-interceptor.service';

const modules = [WebMonitoringModule, EventsGatewayModule, StepExecutorModule];

const services = [
  ActionService,
  RequestInterceptorService,
  EventsGatewayService,
  StepExecutorUtilsService
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ActionModule {}
