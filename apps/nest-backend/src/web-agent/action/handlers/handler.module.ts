import { Module } from '@nestjs/common';
import { ChangeHandler } from './change-handler.service';
import { ClickHandler } from './click-handler.service';
import { HoverHandler } from './hover-handler.service';
import { ChangeStrategyModule } from '../strategies/change-strategies/change-strategy.module';
import { ClickStrategyModule } from '../strategies/click-strategies/click-strategy.module';
import { HoverStrategyModule } from '../strategies/hover-strategies/hover-strategy.module';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { ActionUtilsModule } from '../action-utils/action-utils.module';

const handlers = [ChangeHandler, ClickHandler, HoverHandler];

const strategyModules = [
  ChangeStrategyModule,
  ClickStrategyModule,
  HoverStrategyModule
];

@Module({
  imports: [OsModule, ActionUtilsModule, ...strategyModules],
  providers: [...handlers, ClickStrategyService],
  exports: [...handlers, ...strategyModules, OsModule]
})
export class HandlerModule {}
