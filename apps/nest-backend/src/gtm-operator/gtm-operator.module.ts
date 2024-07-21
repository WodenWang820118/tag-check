import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { InspectorModule } from '../inspector/inspector.module';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';

@Module({
  imports: [WebAgentModule, InspectorModule, EventInspectionPipelineModule],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService],
})
export class GtmOperatorModule {}
