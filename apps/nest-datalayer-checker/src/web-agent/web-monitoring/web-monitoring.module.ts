import { Module } from '@nestjs/common';
import { WebMonitoringService } from './web-monitoring.service';
import { OsModule } from '../../os/os.module';
import { RequestModule } from './request/request.module';
import { DataLayerModule } from './data-layer/data-layer.module';

const modules = [RequestModule, DataLayerModule];
@Module({
  imports: [OsModule, ...modules],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService, ...modules],
})
export class WebMonitoringModule {}
