import { Injectable } from '@nestjs/common';

/**
 * Records when each replay step of the run in progress acted (epoch ms), so
 * the run's result can say where each step is in its screen recordings.
 * Runs share one queue, so one timeline is open at a time.
 *
 * Opened and closed by RunTrackerService around every run; ActionService
 * marks each step just before its action (after the step's wait).
 */
@Injectable()
export class RunTimelineService {
  private open: { eventId: string; steps: (number | undefined)[] } | null =
    null;

  /** A run of `eventId` begins: replaces any timeline left open. */
  begin(eventId: string): void {
    this.open = { eventId, steps: [] };
  }

  /**
   * Step `index` (0-based) of `eventId`'s run acts now. Ignored when no run
   * of `eventId` is open.
   */
  markStep(eventId: string, index: number, at = Date.now()): void {
    if (this.open?.eventId === eventId) {
      this.open.steps[index] = at;
    }
  }

  /**
   * When each step of `eventId`'s open run acted, by step index; a step that
   * has not acted (or was skipped) has no time. Empty when no run of
   * `eventId` is open.
   */
  steps(eventId: string): readonly (number | undefined)[] {
    return this.open?.eventId === eventId ? [...this.open.steps] : [];
  }

  /** The run of `eventId` ended. Does nothing for another run. */
  end(eventId: string): void {
    if (this.open?.eventId === eventId) {
      this.open = null;
    }
  }
}
