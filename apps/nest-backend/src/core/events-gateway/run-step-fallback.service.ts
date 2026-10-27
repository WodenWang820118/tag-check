import { Injectable } from '@nestjs/common';
import type { StepFallback } from '@utils';

/**
 * The fallback selectors the run in progress used when a step's recorded
 * selectors found nothing and one candidate was clearly the element. Runs
 * share one queue, so one list is open at a time.
 *
 * Opened and closed by RunTrackerService around every run; ActionService
 * records a fallback after the retried step succeeds. The result message
 * reads the list before the run ends.
 */
@Injectable()
export class RunStepFallbackService {
  private open: { eventId: string; fallbacks: StepFallback[] } | null = null;

  /** A run of `eventId` begins: replaces any list left open. */
  begin(eventId: string): void {
    this.open = { eventId, fallbacks: [] };
  }

  /**
   * The run of `eventId` used `fallback`. Ignored when no run of `eventId`
   * is open.
   */
  record(eventId: string, fallback: StepFallback): void {
    if (this.open?.eventId === eventId) {
      this.open.fallbacks.push(fallback);
    }
  }

  /**
   * The fallbacks `eventId`'s open run used, in the order they happened.
   * Empty when no run of `eventId` is open.
   */
  fallbacks(eventId: string): readonly StepFallback[] {
    return this.open?.eventId === eventId ? [...this.open.fallbacks] : [];
  }

  /** The run of `eventId` ended. Does nothing for another run. */
  end(eventId: string): void {
    if (this.open?.eventId === eventId) {
      this.open = null;
    }
  }
}
