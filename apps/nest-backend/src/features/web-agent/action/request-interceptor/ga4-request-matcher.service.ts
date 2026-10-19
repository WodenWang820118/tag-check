import { Injectable } from '@nestjs/common';
import { Ga4CollectEvent, parseGa4CollectRequest } from './ga4-collect-request';

/**
 * Picks the GA4 event a test expects out of the events in a collect request.
 *
 * Event names are compared exactly because GA4 event names are case sensitive
 * (https://support.google.com/analytics/answer/13316687). An empty expected
 * measurement ID accepts events sent to any GA4 property.
 */
@Injectable()
export class Ga4RequestMatcher {
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

  isMatchingGa4Request(
    url: string,
    postData: string,
    eventName: string,
    measurementId: string
  ): boolean {
    return (
      this.findMatchingEvent(
        parseGa4CollectRequest(url, postData),
        eventName,
        measurementId
      ) !== null
    );
  }
}

function normalizeMeasurementId(measurementId: string): string {
  return measurementId.trim().toUpperCase();
}
