import { Module } from '@nestjs/common';
import { InspectorService } from './inspector.service';
import { InspectorController } from './inspector.controller';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { SharedModule } from '../shared-module/shared-module.module';
import { RequestProcessorModule } from './request-processor/request-processor.module';
import { RequestProcessorService } from './request-processor/request-processor.service';

@Module({
  imports: [WebAgentModule, SharedModule, RequestProcessorModule],
  providers: [InspectorService, RequestProcessorService],
  controllers: [InspectorController],
})
export class InspectorModule {}
