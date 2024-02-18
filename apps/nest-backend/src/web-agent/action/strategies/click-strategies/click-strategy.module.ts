import { Module } from '@nestjs/common';
import { OsModule } from './../../../../os/os.module';
import { EvaluateClickService } from './evaluate-click.service';
import { PageClickService } from './page-click.service';
import { ClickStrategyService } from './click-strategy.service';

const operationStrategies = [EvaluateClickService, PageClickService];

@Module({
  imports: [OsModule],
  providers: [...operationStrategies, ClickStrategyService],
  exports: [...operationStrategies, ClickStrategyService],
})
export class ClickStrategyModule {}
