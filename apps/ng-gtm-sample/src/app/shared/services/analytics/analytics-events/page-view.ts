import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';

export class PageViewEventTracker implements AnalyticsEventTracker<
  Record<string, unknown>
> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(
    rawEventData: Record<string, unknown>
  ): ProcessedAnalyticsEvent {
    return {
      eventData: rawEventData
    };
  }
}
