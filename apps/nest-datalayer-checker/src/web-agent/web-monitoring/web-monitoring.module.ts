import { Module } from '@nestjs/common';
import { WebMonitoringService } from './web-monitoring.service';
import { SharedModule } from '../../shared/shared.module';
import { RequestModule } from './request/request.module';
import { DataLayerModule } from './data-layer/data-layer.module';
@Module({
  imports: [SharedModule, RequestModule, DataLayerModule],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
