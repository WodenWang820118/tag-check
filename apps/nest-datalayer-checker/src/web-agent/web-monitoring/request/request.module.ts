import { Module } from '@nestjs/common';
import { DataLayerModule } from '../data-layer/data-layer.module';
import { RequestService } from './request.service';

@Module({
  imports: [DataLayerModule],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
