import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { UtilitiesModule } from '../utilities/utilities.module';
import { WebMonitoringModule } from '../web-monitoring/web-monitoring.module';
import { SharedModule } from '../../shared/shared.module';
import { DataLayerModule } from '../web-monitoring/data-layer/data-layer.module';
import { HandlerModule } from './handlers/handler.module';
import { HoverStrategyModule } from './strategies/hover-strategies/hover-strategy.module';
import { ClickStrategyModule } from './strategies/click-strategies/click-strategy.module';
import { ChangeStrategyModule } from './strategies/change-strategies/change-strategy.module';

@Module({
  imports: [
    UtilitiesModule,
    WebMonitoringModule,
    SharedModule,
    DataLayerModule,
    HandlerModule,
    ChangeStrategyModule,
    ClickStrategyModule,
    HoverStrategyModule,
  ],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
