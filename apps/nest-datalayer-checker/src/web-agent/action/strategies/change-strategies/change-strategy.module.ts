import { Module } from '@nestjs/common';
import { DataLayerModule } from '../../../web-monitoring/data-layer/data-layer.module';
import { ChangeStrategyService } from './change-strategy.service';
import { EvaluateChangeService } from './evaluate-change.service';
import { PageChangeService } from './page-change.service';

@Module({
  imports: [DataLayerModule],
  providers: [ChangeStrategyService, EvaluateChangeService, PageChangeService],
  exports: [ChangeStrategyService, EvaluateChangeService, PageChangeService],
})
export class ChangeStrategyModule {}
