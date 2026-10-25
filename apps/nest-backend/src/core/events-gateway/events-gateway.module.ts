import { Module } from '@nestjs/common';
import { ProgressEventsService } from './progress-events.service';
import { RunStatusService } from './run-status.service';

/**
 * The progress events module; import this module to send or stream progress
 * and run status.
 */
@Module({
  providers: [ProgressEventsService, RunStatusService],
  exports: [ProgressEventsService, RunStatusService]
})
export class EventsGatewayModule {}
