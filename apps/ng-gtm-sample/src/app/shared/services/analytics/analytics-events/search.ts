import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';

export class SearchEventTracker implements AnalyticsEventTracker<string> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: string): ProcessedAnalyticsEvent {
    return {
      eventData: { search_term: rawEventData }
    };
  }
}
