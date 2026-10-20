import {
  AnalyticsEventTracker,
  ProcessedAnalyticsEvent
} from '../../../models/analytics-event-tracker.model';

export class LoginEventTracker implements AnalyticsEventTracker<
  Record<string, unknown>
> {
  constructor(private readonly eventName: string) {
    this.eventName = eventName;
  }

  getProcessedData(
    rawEventData: Record<string, unknown>
  ): ProcessedAnalyticsEvent {
    return {
      eventData: rawEventData
    };
  }
}
