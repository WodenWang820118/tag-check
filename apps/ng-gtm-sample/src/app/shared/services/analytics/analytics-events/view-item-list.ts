import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

export class ViewItemListEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: any) {
    if (!rawEventData.ecommerce.items.length) return;

    return {
      eventData: rawEventData,
    };
  }
}
