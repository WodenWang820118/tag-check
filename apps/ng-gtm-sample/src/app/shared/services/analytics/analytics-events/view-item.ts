import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

export class ViewItemEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: any) {
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
            quantity: 1,
          },
        ],
      },
    };

    return {
      eventData: event,
    };
  }
}
