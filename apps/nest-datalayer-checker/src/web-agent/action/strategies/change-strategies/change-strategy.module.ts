import { Module } from '@nestjs/common';
import { DataLayerModule } from '../../../web-monitoring/data-layer/data-layer.module';
import { AriaChangeStrategy } from './aria-change-strategy.service';
import { CSSChangeStrategy } from './css-change-strategy.service';
import { PierceChangeStrategy } from './pierce-change-strategy.service';
import { XpathChangeStrategy } from './xpath-change-strategy.service';

const changeStrategies = [
  AriaChangeStrategy,
  CSSChangeStrategy,
  PierceChangeStrategy,
  XpathChangeStrategy,
];

@Module({
  imports: [DataLayerModule],
  providers: [...changeStrategies],
  exports: [...changeStrategies],
})
export class ChangeStrategyModule {}
