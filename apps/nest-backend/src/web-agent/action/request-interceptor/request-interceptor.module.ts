import { Module } from '@nestjs/common';
import { DataLayerModule } from '../web-monitoring/data-layer/data-layer.module';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { HandlerModule } from '../handlers/handler.module';

@Module({
  imports: [DataLayerModule, HandlerModule],
  providers: [DataLayerService],
  exports: [],
})
export class RequestInterceptorModule {}
