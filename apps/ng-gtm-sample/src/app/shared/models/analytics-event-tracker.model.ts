/**
 * Parameters a tracker hands to `AnalyticsService.saveDataLayerEvent`. An
 * empty string means "nothing to push" (see `ViewPromotionEventTracker`).
 */
export interface ProcessedAnalyticsEvent {
  eventData: Record<string, unknown> | '';
}

/**
 * Turns the payload passed to `AnalyticsService.trackEvent` into dataLayer
 * parameters. Each tracker declares the payload shape its call sites send.
 */
export interface AnalyticsEventTracker<TRawEventData = unknown> {
  getProcessedData(
    rawEventData: TRawEventData
  ): ProcessedAnalyticsEvent | undefined;
}
