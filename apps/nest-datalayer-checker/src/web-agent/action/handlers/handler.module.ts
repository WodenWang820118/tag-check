import { ClickStrategy } from './../strategies/click-strategies/utils';
import { Module } from '@nestjs/common';
import { ChangeHandler } from './change-handler.service';
import { ClickHandler } from './click-handler.service';
import { HoverHandler } from './hover-handler.service';
import { UtilitiesModule } from '../../utilities/utilities.module';
import { ChangeStrategyModule } from '../strategies/change-strategies/change-strategy.module';
import { ClickStrategyModule } from '../strategies/click-strategies/click-strategy.module';
import { HoverStrategyModule } from '../strategies/hover-strategies/hover-strategy.module';
import { SharedModule } from '../../../shared/shared.module';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';

const handlers = [ChangeHandler, ClickHandler, HoverHandler];

const strategies = [
  ChangeStrategyModule,
  ClickStrategyModule,
  HoverStrategyModule,
];

@Module({
  imports: [UtilitiesModule, SharedModule, ...strategies],
  providers: [...handlers, ClickStrategyService],
  exports: [...handlers, ClickStrategyService],
})
export class HandlerModule {}
