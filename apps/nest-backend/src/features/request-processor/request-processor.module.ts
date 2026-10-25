import { Module } from '@nestjs/common';
import { RequestProcessorService } from './request-processor.service';

/** Provides the rebuilding of dataLayer events from GA4 requests. */
@Module({
  providers: [RequestProcessorService],
  exports: [RequestProcessorService]
})
export class RequestProcessorModule {}
