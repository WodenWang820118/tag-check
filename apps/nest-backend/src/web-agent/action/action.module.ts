import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { UtilitiesModule } from '../utilities/utilities.module';
import { WebMonitoringModule } from '../web-monitoring/web-monitoring.module';
import { OsModule } from '../../os/os.module';
import { DataLayerModule } from '../web-monitoring/data-layer/data-layer.module';
import { HandlerModule } from './handlers/handler.module';
import { HoverStrategyModule } from './strategies/hover-strategies/hover-strategy.module';
import { ClickStrategyModule } from './strategies/click-strategies/click-strategy.module';
import { ChangeStrategyModule } from './strategies/change-strategies/change-strategy.module';
import { RequestInterceptor } from './request-interceptor';

const modules = [
  HandlerModule,
  ChangeStrategyModule,
  ClickStrategyModule,
  HoverStrategyModule,
];

@Module({
  imports: [
    UtilitiesModule,
    WebMonitoringModule,
    OsModule,
    DataLayerModule,
    ...modules,
  ],
  providers: [ActionService, RequestInterceptor],
  exports: [ActionService, RequestInterceptor, ...modules],
})
export class ActionModule {}
