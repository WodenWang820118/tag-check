import { Module } from '@nestjs/common';
import { InspectorService } from './inspector.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { OsModule } from '../os/os.module';
import { RequestProcessorModule } from './request-processor/request-processor.module';
import { RequestProcessorService } from './request-processor/request-processor.service';

@Module({
  imports: [WebAgentModule, OsModule, RequestProcessorModule],
  providers: [InspectorService, RequestProcessorService],
  exports: [InspectorService],
})
export class InspectorModule {}
