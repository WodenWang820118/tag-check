import { Module } from '@nestjs/common';
import { ActionModule } from './action/action.module';
import { WebMonitoringModule } from './web-monitoring/web-monitoring.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { WebAgentService } from './web-agent.service';
import { SharedModule } from '../shared/shared.module';
import { DataLayerModule } from './web-monitoring/data-layer/data-layer.module';

@Module({
  imports: [
    ActionModule,
    WebMonitoringModule,
    UtilitiesModule,
    SharedModule,
    DataLayerModule,
  ],
  exports: [WebAgentService],
  providers: [WebAgentService],
})
export class WebAgentModule {}
