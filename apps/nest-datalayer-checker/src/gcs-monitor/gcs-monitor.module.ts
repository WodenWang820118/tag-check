import { Module } from '@nestjs/common';
import { GcsMonitorService } from './gcs-monitor.service';
import { WebAgentModule } from '../web-agent/web-agent.module';

@Module({
  imports: [WebAgentModule],
  providers: [GcsMonitorService],
})
export class GcsMonitorModule {}
