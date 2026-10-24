import { Injectable } from '@nestjs/common';
import { Ga4CollectEvent } from './ga4-collect-request';

/**
 * Picks the GA4 event a test expects out of the events in a collect request.
 *
 * Event names are compared exactly because GA4 event names are case sensitive
 * (https://support.google.com/analytics/answer/13316687). An empty expected
 * measurement ID accepts events sent to any GA4 property.
 */
@Injectable()
export class Ga4RequestMatcher {
  /**
   * Returns the first event named `eventName` and sent to `measurementId`,
   * or null. Surrounding whitespace in the expected values is ignored, and
   * measurement IDs are compared without regard to case.
   */
  findMatchingEvent(
    events: readonly Ga4CollectEvent[],
    eventName: string,
    measurementId: string
  ): Ga4CollectEvent | null {
    const expectedEventName = eventName.trim();
    const expectedMeasurementId = normalizeMeasurementId(measurementId);
    return (
      events.find(
        (event) =>
          event.eventName === expectedEventName &&
          (!expectedMeasurementId ||
            normalizeMeasurementId(event.measurementId) ===
              expectedMeasurementId)
      ) ?? null
    );
  }
}

function normalizeMeasurementId(measurementId: string): string {
  return measurementId.trim().toUpperCase();
}
