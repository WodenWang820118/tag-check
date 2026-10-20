import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';
import { Destination } from '../../../models/destination.model';

export class SelectPromotionEventTracker implements AnalyticsEventTracker<Destination> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(
    eventData: Destination
  ): ProcessedAnalyticsEvent | undefined {
    if (!eventData) return;
    const event = {
      ecommerce: {
        promotion_id: eventData.id, // required for ga4_ecom_attributor
        promotion_name: eventData.title, // required for ga4_ecom_attributor
        creative_name: 'travel_slide', // required for ga4_ecom_attributor
        creative_slot: 'featured_attributor', // required for ga4_ecom_attributor
        items: [
          {
            item_id: eventData.id,
            item_name: eventData.title
          }
        ]
      }
    };

    return {
      eventData: event
    };
  }
}
