import { Module } from '@nestjs/common';
import { ProgressEventsService } from './progress-events.service';
import { RunStatusService } from './run-status.service';
import { RunTimelineService } from './run-timeline.service';
import { RunStepOverrideService } from './run-step-override.service';

/**
 * The progress events module; import this module to send or stream progress
 * and run status, to time a run's steps, or to try other selectors for one
 * step of a run.
 */
@Module({
  providers: [
    ProgressEventsService,
    RunStatusService,
    RunTimelineService,
    RunStepOverrideService
  ],
  exports: [
    ProgressEventsService,
    RunStatusService,
    RunTimelineService,
    RunStepOverrideService
  ]
})
export class EventsGatewayModule {}
