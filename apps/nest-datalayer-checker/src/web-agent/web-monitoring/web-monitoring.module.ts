import { Module } from '@nestjs/common';
import { WebMonitoringService } from './web-monitoring.service';
import { OsModule } from '../../os/os.module';
import { RequestModule } from './request/request.module';
import { DataLayerModule } from './data-layer/data-layer.module';
@Module({
  imports: [OsModule, RequestModule, DataLayerModule],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
