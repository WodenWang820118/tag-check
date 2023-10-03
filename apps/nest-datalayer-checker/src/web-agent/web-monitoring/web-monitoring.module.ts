import { Module } from '@nestjs/common';
import { WebMonitoringController } from './web-monitoring.controller';
import { WebMonitoringService } from './web-monitoring.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { SharedModule } from '../../shared/shared.module';
@Module({
  imports: [PuppeteerModule, SharedModule],
  controllers: [WebMonitoringController],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
