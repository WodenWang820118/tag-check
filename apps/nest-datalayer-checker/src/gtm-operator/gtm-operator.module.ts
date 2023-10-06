import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService],
})
export class GtmOperatorModule {}
