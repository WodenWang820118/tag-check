import { Module } from '@nestjs/common';
import { GcsMonitorService } from './gcs-monitor.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { WebMonitoringModule } from '../web-agent/web-monitoring/web-monitoring.module';
@Module({
  imports: [WebAgentModule, WebMonitoringModule],
  providers: [GcsMonitorService],
})
export class GcsMonitorModule {}
