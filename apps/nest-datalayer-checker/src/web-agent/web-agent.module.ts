import { Module } from '@nestjs/common';
import { ActionModule } from './action/action.module';
import { WebMonitoringModule } from './web-monitoring/web-monitoring.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { WebAgentService } from './web-agent.service';
import { WebAgentController } from './web-agent.controller';
import { SharedModule } from '../shared/shared.module';
import { DataLayerModule } from './web-monitoring/data-layer/data-layer.module';

@Module({
  imports: [
    ActionModule,
    WebMonitoringModule,
    PuppeteerModule,
    UtilitiesModule,
    SharedModule,
    DataLayerModule,
  ],
  exports: [WebAgentService],
  providers: [WebAgentService],
  controllers: [WebAgentController],
})
export class WebAgentModule {}
