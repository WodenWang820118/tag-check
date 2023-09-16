import { Module } from '@nestjs/common';
import { WebMonitoringController } from './web-monitoring.controller';
import { WebMonitoringService } from './web-monitoring.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';

@Module({
  imports: [PuppeteerModule],
  controllers: [WebMonitoringController],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
