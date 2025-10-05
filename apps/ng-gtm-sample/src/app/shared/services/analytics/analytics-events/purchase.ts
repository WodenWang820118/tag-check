import { Order } from '../../../models/order.model';
import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';
import { v4 as uuidv4 } from 'uuid';

export class PurchaseEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: any) {
    if (!rawEventData.length) return;
    const event = {
      ecommerce: {
        currency: 'USD',
        transaction_id: this.generateTransactionId(),
        value: rawEventData.reduce(
          (accumulator: number, currentValue: any) =>
            accumulator + currentValue.value,
          0
        ),
        items: rawEventData.map((item: Order) => ({
          item_id: item.id,
          item_name: item.title,
          item_category: item.category,
          quantity: Number(item.quantity),
          price: item.value,
        })),
      },
    };

    return {
      eventData: event,
    };
  }

  generateTransactionId(): string {
    return uuidv4();
  }
}
