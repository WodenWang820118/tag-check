import { Module } from '@nestjs/common';
import { ProgressEventsService } from './progress-events.service';
import { RunStatusService } from './run-status.service';
import { RunTimelineService } from './run-timeline.service';
import { RunStepFallbackService } from './run-step-fallback.service';
import { RunStepOverrideService } from './run-step-override.service';

/**
 * The progress events module; import this module to send or stream progress
 * and run status, to time a run's steps, to remember the fallback selectors
 * a run used, or to try other selectors for one step of a run.
 */
@Module({
  providers: [
    ProgressEventsService,
    RunStatusService,
    RunTimelineService,
    RunStepFallbackService,
    RunStepOverrideService
  ],
  exports: [
    ProgressEventsService,
    RunStatusService,
    RunTimelineService,
    RunStepFallbackService,
    RunStepOverrideService
  ]
})
export class EventsGatewayModule {}
