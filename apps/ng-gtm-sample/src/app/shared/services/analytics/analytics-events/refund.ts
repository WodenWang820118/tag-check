import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

export class RefundEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  // TODO: the transaction id should be the same as the one used in the purchase event
  getProcessedData(rawEventData: any) {
    if (!rawEventData.length) return;
    const event = {
      ecommerce: {
        currency: 'USD',
        transaction_id: 'gtm-transaction-id-1234',
        value: rawEventData.reduce(
          (accumulator: number, currentValue: any) =>
            accumulator + currentValue.value,
          0
        ),
        items: rawEventData.map((item: any) => ({
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
}
