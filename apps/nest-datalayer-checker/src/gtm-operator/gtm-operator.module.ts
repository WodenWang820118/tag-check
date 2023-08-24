import { Module } from '@nestjs/common';
import { GtmOperatorController } from './gtm-operator.controller';
import { GtmOperatorService } from './gtm-operator.service';
import { WebAgentModule } from '../web-agent/web-agent.module';

@Module({
  imports: [WebAgentModule],
  controllers: [GtmOperatorController],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService],
})
export class GtmOperatorModule {}
