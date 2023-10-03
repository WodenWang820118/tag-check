import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { UtilitiesModule } from '../utilities/utilities.module';
import { WebMonitoringModule } from '../web-monitoring/web-monitoring.module';

@Module({
  imports: [PuppeteerModule, UtilitiesModule, WebMonitoringModule],
  controllers: [],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
