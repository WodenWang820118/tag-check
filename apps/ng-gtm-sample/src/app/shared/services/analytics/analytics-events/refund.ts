import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';
import { Order } from '../../../models/order.model';

export class RefundEventTracker implements AnalyticsEventTracker<Order[]> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  // NOTE: The transaction ID should match the one used in the purchase event
  getProcessedData(rawEventData: Order[]): ProcessedAnalyticsEvent | undefined {
    if (!rawEventData.length) return;
    const event = {
      ecommerce: {
        currency: 'USD',
        transaction_id: 'gtm-transaction-id-1234',
        value: rawEventData.reduce(
          (accumulator: number, currentValue: Order) =>
            accumulator + currentValue.value,
          0
        ),
        items: rawEventData.map((item: Order) => ({
          item_id: item.id,
          item_name: item.title,
          item_category: item.category,
          quantity: Number(item.quantity),
          price: item.value
        }))
      }
    };

    return {
      eventData: event
    };
  }
}
