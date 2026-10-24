import { Module } from '@nestjs/common';
import { EvaluateClickService } from './evaluate-click.service';
import { PageClickService } from './page-click.service';
import { ClickStrategyService } from './click-strategy.service';
import { ActionUtilsModule } from '../../action-utils/action-utils.module';

const operationStrategies = [
  EvaluateClickService,
  PageClickService,
  ClickStrategyService
];

/** Provides the ways of clicking an element. */
@Module({
  imports: [ActionUtilsModule],
  providers: [...operationStrategies],
  exports: [...operationStrategies]
})
export class ClickStrategyModule {}
