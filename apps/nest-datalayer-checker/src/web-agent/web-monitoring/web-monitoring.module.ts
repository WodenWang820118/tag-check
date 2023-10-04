import { Module } from '@nestjs/common';
import { WebMonitoringController } from './web-monitoring.controller';
import { WebMonitoringService } from './web-monitoring.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { SharedModule } from '../../shared/shared.module';
import { RequestModule } from './request/request.module';
@Module({
  imports: [PuppeteerModule, SharedModule, RequestModule],
  controllers: [WebMonitoringController],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
