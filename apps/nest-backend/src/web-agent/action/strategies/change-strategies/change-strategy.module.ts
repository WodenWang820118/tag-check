import { Module } from '@nestjs/common';
import { ChangeStrategyService } from './change-strategy.service';
import { EvaluateChangeService } from './evaluate-change.service';
import { PageChangeService } from './page-change.service';

@Module({
  imports: [],
  providers: [ChangeStrategyService, EvaluateChangeService, PageChangeService],
  exports: [ChangeStrategyService, EvaluateChangeService, PageChangeService],
})
export class ChangeStrategyModule {}
