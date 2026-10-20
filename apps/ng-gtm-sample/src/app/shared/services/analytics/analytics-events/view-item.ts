import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';
import { Destination } from '../../../models/destination.model';

export class ViewItemEventTracker implements AnalyticsEventTracker<Destination> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(
    rawEventData: Destination
  ): ProcessedAnalyticsEvent | undefined {
    if (!rawEventData) return;
    const event = {
      ecommerce: {
        currency: 'USD',
        value: rawEventData.price,
        items: [
          {
            item_id: rawEventData.id,
            item_name: rawEventData.title,
            item_category: rawEventData.title,
            price: rawEventData.price,
            quantity: 1
          }
        ]
      }
    };

    return {
      eventData: event
    };
  }
}
