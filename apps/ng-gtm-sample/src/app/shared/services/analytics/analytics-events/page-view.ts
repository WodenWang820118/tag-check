import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

export class PageViewEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: any) {
    return {
      eventData: rawEventData,
    };
  }
}
