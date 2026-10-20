import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';

/** Payload built by `DestinationComponent.trackViewItemList`. */
type ViewItemListEventData = {
  ecommerce: { items: Record<string, unknown>[] };
};

export class ViewItemListEventTracker implements AnalyticsEventTracker<ViewItemListEventData> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(
    rawEventData: ViewItemListEventData
  ): ProcessedAnalyticsEvent | undefined {
    if (!rawEventData.ecommerce.items.length) return;

    return {
      eventData: rawEventData
    };
  }
}
