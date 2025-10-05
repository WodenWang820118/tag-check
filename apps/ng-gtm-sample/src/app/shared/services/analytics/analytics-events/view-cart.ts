import { AnalyticsEventTracker } from '../../../models/analytics-event-tracker.model';

export class ViewCartEventTracker implements AnalyticsEventTracker {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(rawEventData: any) {
    if (!rawEventData.length) return;
    const event = {
      ecommerce: {
        currency: 'USD',
        value: rawEventData.reduce(
          (accumulator: number, currentValue: any) =>
            accumulator + currentValue.value * currentValue.quantity,
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
