import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [WebAgentModule, InspectorModule, PipelineModule],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService],
})
export class GtmOperatorModule {}
