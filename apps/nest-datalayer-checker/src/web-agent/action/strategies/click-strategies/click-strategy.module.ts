import { Module } from '@nestjs/common';
import { SharedModule } from './../../../../shared/shared.module';
import { EvaluateClickService } from './evaluate-click.service';
import { PageClickService } from './page-click.service';
import { ClickStrategyService } from './click-strategy.service';

const operationStrategies = [EvaluateClickService, PageClickService];

@Module({
  imports: [SharedModule],
  providers: [...operationStrategies, ClickStrategyService],
  exports: [...operationStrategies, ClickStrategyService],
})
export class ClickStrategyModule {}
