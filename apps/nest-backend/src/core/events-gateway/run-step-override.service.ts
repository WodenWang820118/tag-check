import { Injectable } from '@nestjs/common';
import type { SelectorTrialRequest } from '@utils';

/**
 * The selectors one step of the run in progress tries instead of its own,
 * for a trial of a suggested replacement: the recording itself does not
 * change. Runs share one queue, so one override is open at a time.
 *
 * Opened and closed by RunTrackerService around a run that asks for one;
 * ActionService reads it for each step.
 */
@Injectable()
export class RunStepOverrideService {
  private open: { eventId: string; override: SelectorTrialRequest } | null =
    null;

  /** A run of `eventId` begins with `override`, or without one (null). */
  begin(eventId: string, override: SelectorTrialRequest | null): void {
    this.open = override ? { eventId, override } : null;
  }

  /**
   * The selectors step `index` (0-based) of `eventId`'s run tries instead of
   * its own; null when it keeps its own.
   */
  selectorsFor(eventId: string, index: number): readonly string[] | null {
    return this.open?.eventId === eventId &&
      this.open.override.stepIndex === index
      ? this.open.override.selectors
      : null;
  }

  /** The run of `eventId` ended. Does nothing for another run. */
  end(eventId: string): void {
    if (this.open?.eventId === eventId) {
      this.open = null;
    }
  }
}
