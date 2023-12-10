import { Module } from '@nestjs/common';
import { DataLayerModule } from '../../../web-monitoring/data-layer/data-layer.module';
import { HoverStrategyService } from './hover-strategy.service';
import { PageHoverService } from './page-hover.service';
import { EvaluateHoverService } from './evaluate-hover.service';

@Module({
  imports: [DataLayerModule],
  providers: [HoverStrategyService, PageHoverService, EvaluateHoverService],
  exports: [HoverStrategyService, PageHoverService, EvaluateHoverService],
})
export class HoverStrategyModule {}
