import { Module } from '@nestjs/common';
import { InspectorService } from './inspector.service';
import { InspectorController } from './inspector.controller';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { SharedModule } from '../shared-module/shared-module.module';

@Module({
  imports: [WebAgentModule, SharedModule],
  providers: [InspectorService],
  controllers: [InspectorController],
})
export class InspectorModule {}
