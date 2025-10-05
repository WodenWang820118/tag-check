import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

export class SearchEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: any) {
    return {
      eventData: { search_term: rawEventData },
    };
  }
}
