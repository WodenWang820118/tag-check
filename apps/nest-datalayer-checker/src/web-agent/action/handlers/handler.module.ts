import { Module } from '@nestjs/common';
import { ChangeHandler } from './change-handler.service';
import { ClickHandler } from './click-handler.service';
import { HoverHandler } from './hover-handler.service';
import { UtilitiesModule } from '../../utilities/utilities.module';
import { ChangeStrategyModule } from '../strategies/change-strategies/change-strategy.module';
import { ClickStrategyModule } from '../strategies/click-strategies/click-strategy.module';
import { HoverStrategyModule } from '../strategies/hover-strategies/hover-strategy.module';
import { SharedModule } from '../../../shared/shared.module';

@Module({
  imports: [
    UtilitiesModule,
    ChangeStrategyModule,
    ClickStrategyModule,
    HoverStrategyModule,
    SharedModule,
  ],
  providers: [ChangeHandler, ClickHandler, HoverHandler],
  exports: [ChangeHandler, ClickHandler, HoverHandler],
})
export class HandlerModule {}
