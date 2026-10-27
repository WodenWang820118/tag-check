import { Module } from '@nestjs/common';
import { ProgressEventsService } from './progress-events.service';
import { RunStatusService } from './run-status.service';
import { RunTimelineService } from './run-timeline.service';

/**
 * The progress events module; import this module to send or stream progress
 * and run status, or to time a run's steps.
 */
@Module({
  providers: [ProgressEventsService, RunStatusService, RunTimelineService],
  exports: [ProgressEventsService, RunStatusService, RunTimelineService]
})
export class EventsGatewayModule {}
