import { Module } from '@nestjs/common';
import { ProgressEventsService } from './progress-events.service';

/** The progress events module; import this module to send or stream progress. */
@Module({
  providers: [ProgressEventsService],
  exports: [ProgressEventsService]
})
export class EventsGatewayModule {}
