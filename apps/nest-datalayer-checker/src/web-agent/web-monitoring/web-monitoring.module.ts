import { Module } from '@nestjs/common';
import { WebMonitoringController } from './web-monitoring.controller';
import { WebMonitoringService } from './web-monitoring.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { SharedModule } from '../../shared/shared.module';
import { RequestModule } from './request/request.module';
import { DataLayerModule } from './data-layer/data-layer.module';
@Module({
  imports: [PuppeteerModule, SharedModule, RequestModule, DataLayerModule],
  controllers: [WebMonitoringController],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
