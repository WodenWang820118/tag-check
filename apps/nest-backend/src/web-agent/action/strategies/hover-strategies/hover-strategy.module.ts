import { Module } from '@nestjs/common';
import { HoverStrategyService } from './hover-strategy.service';
import { PageHoverService } from './page-hover.service';
import { EvaluateHoverService } from './evaluate-hover.service';

@Module({
  imports: [],
  providers: [HoverStrategyService, PageHoverService, EvaluateHoverService],
  exports: [HoverStrategyService, PageHoverService, EvaluateHoverService],
})
export class HoverStrategyModule {}
