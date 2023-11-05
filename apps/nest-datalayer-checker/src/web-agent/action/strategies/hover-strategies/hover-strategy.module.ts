import { Module } from '@nestjs/common';
import { DataLayerModule } from '../../../web-monitoring/data-layer/data-layer.module';
import { AriaHoverStrategy } from './aria-hover-strategy.service';
import { CSSHoverStrategy } from './css-hover-strategy.service';
import { XPathHoverStrategy } from './xpath-hover-strategy.service';
import { TextHoverStrategy } from './text-hover-strategy.service';
import { PierceHoverStrategy } from './pierce-hover-strategy.service';

const hoverStrategies = [
  AriaHoverStrategy,
  CSSHoverStrategy,
  XPathHoverStrategy,
  TextHoverStrategy,
  PierceHoverStrategy,
];

@Module({
  imports: [DataLayerModule],
  providers: [...hoverStrategies],
  exports: [...hoverStrategies],
})
export class HoverStrategyModule {}
