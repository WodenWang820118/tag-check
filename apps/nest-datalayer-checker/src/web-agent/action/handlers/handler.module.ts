import { Module } from '@nestjs/common';
import { ChangeHandler } from './change-handler.service';
import { ClickHandler } from './click-handler.service';
import { HoverHandler } from './hover-handler.service';
import { UtilitiesModule } from '../../utilities/utilities.module';
import { ChangeStrategyModule } from '../strategies/change-strategies/change-strategy.module';
import { ClickStrategyModule } from '../strategies/click-strategies/click-strategy.module';
import { HoverStrategyModule } from '../strategies/hover-strategies/hover-strategy.module';
import { OsModule } from '../../../os/os.module';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';

const handlers = [ChangeHandler, ClickHandler, HoverHandler];

const strategies = [
  ChangeStrategyModule,
  ClickStrategyModule,
  HoverStrategyModule,
];

@Module({
  imports: [UtilitiesModule, OsModule, ...strategies],
  providers: [...handlers, ClickStrategyService],
  exports: [...handlers],
})
export class HandlerModule {}
