import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { WebMonitoringModule } from '../web-monitoring/web-monitoring.module';
import { HandlerModule } from './handlers/handler.module';
import { RequestInterceptor } from './request-interceptor';

@Module({
  imports: [WebMonitoringModule, HandlerModule],
  providers: [ActionService, RequestInterceptor],
  exports: [
    ActionService,
    RequestInterceptor,
    HandlerModule,
    WebMonitoringModule,
  ],
})
export class ActionModule {}
