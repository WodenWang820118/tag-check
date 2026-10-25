import type { RunTrackerService } from './run-tracker.service';

/** A RunTrackerService that runs the task and reports nothing. */
export function passThroughTracker(): RunTrackerService {
  const tracker: Pick<RunTrackerService, 'track'> = {
    track: (_run, _signal, task) => task()
  };
  return tracker as RunTrackerService;
}
