import { Module } from '@nestjs/common';
import { InspectorService } from './inspector.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { SharedModule } from '../shared/shared.module';
import { RequestProcessorModule } from './request-processor/request-processor.module';
import { RequestProcessorService } from './request-processor/request-processor.service';

@Module({
  imports: [WebAgentModule, SharedModule, RequestProcessorModule],
  providers: [InspectorService, RequestProcessorService],
  exports: [InspectorService],
})
export class InspectorModule {}
