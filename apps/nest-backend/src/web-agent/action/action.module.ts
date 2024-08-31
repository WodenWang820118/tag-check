import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { WebMonitoringModule } from '../web-monitoring/web-monitoring.module';
import { HandlerModule } from './handlers/handler.module';
import { RequestInterceptor } from './request-interceptor';
import { EventsGatewayModule } from '../../events-gateway/events-gateway.module';
import { EventsGatewayService } from '../../events-gateway/events-gateway.service';

@Module({
  imports: [WebMonitoringModule, HandlerModule, EventsGatewayModule],
  providers: [ActionService, RequestInterceptor, EventsGatewayService],
  exports: [
    ActionService,
    RequestInterceptor,
    HandlerModule,
    WebMonitoringModule,
  ],
})
export class ActionModule {}
