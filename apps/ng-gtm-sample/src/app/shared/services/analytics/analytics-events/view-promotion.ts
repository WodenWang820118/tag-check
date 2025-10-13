import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

const promotions: string[] = [];

export class ViewPromotionEventTracker implements AnalyticsEventTracker {
  item_id: string;
  constructor(private readonly eventName: string) {
    this.item_id = '';
  }

  private isPromotionTracked(newPromotion: any): boolean {
    // Assuming that each promotion has a unique 'id' property
    return promotions.some(
      (item_id) => item_id === newPromotion.ecommerce.items[0]['item_id']
    );
  }

  getProcessedData(rawEventData: any) {
    if (!rawEventData) return;

    const event = {
      ecommerce: {
        promotion_id: rawEventData.id, // required for ga4_ecom_attributor
        promotion_name: rawEventData.title, // required for ga4_ecom_attributor
        creative_name: 'travel_slide', // required for ga4_ecom_attributor
        creative_slot: 'featured_attributor', // required for ga4_ecom_attributor
        items: [
          {
            item_id: rawEventData.id,
            item_name: rawEventData.title,
          },
        ],
      },
    };

    if (!this.isPromotionTracked(event)) {
      this.item_id = event.ecommerce.items[0].item_id;
      promotions.push(this.item_id);

      return {
        eventData: event,
      };
    }

    return {
      eventData: '',
    };
  }
}
