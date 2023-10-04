import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { UtilitiesModule } from '../utilities/utilities.module';
import { WebMonitoringModule } from '../web-monitoring/web-monitoring.module';
import { SharedModule } from '../../shared/shared.module';
import { DataLayerModule } from '../web-monitoring/data-layer/data-layer.module';
@Module({
  imports: [
    PuppeteerModule,
    UtilitiesModule,
    WebMonitoringModule,
    SharedModule,
    DataLayerModule,
  ],
  controllers: [],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
