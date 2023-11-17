import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';

@Module({
  imports: [WebAgentModule, InspectorModule],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService],
})
export class GtmOperatorModule {}
