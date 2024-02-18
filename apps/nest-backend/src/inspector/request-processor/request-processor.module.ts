import { Module } from '@nestjs/common';
import { RequestProcessorService } from './request-processor.service';

@Module({
  providers: [RequestProcessorService],
})
export class RequestProcessorModule {}
