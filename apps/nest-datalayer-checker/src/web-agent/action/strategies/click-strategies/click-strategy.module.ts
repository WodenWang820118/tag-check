import { Module } from '@nestjs/common';
import { DataLayerModule } from '../../../web-monitoring/data-layer/data-layer.module';
import { AriaClickStrategy } from './aria-click-strategy.service';
import { PierceClickStrategy } from './pierce-click-strategy.service';
import { CSSClickStrategy } from './css-click-strategy.service';
import { TextClickStrategy } from './text-click-strategy.service';
import { XPathClickStrategy } from './xpath-click-strategy.service';

const clickStrategies = [
  AriaClickStrategy,
  PierceClickStrategy,
  CSSClickStrategy,
  TextClickStrategy,
  XPathClickStrategy,
];

@Module({
  imports: [DataLayerModule],
  providers: [...clickStrategies],
  exports: [...clickStrategies],
})
export class ClickStrategyModule {}
