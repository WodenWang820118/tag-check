import { Module } from '@nestjs/common';
import { WebMonitoringService } from './web-monitoring.service';
import { SharedModule } from '../../shared/shared.module';
import { RequestModule } from './request/request.module';
@Module({
  imports: [SharedModule, RequestModule],
  controllers: [],
  providers: [WebMonitoringService],
  exports: [WebMonitoringService],
})
export class WebMonitoringModule {}
