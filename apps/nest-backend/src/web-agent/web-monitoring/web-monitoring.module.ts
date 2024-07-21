import { Module } from '@nestjs/common';
import { WebMonitoringService } from './web-monitoring.service';
import { RequestModule } from './request/request.module';
import { DataLayerModule } from './data-layer/data-layer.module';

const modules = [RequestModule, DataLayerModule];
@Module({
  imports: [...modules],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService, ...modules],
})
export class WebMonitoringModule {}
