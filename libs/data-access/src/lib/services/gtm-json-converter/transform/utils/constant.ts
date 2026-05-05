export const BUILT_IN_SCROLL_EVENT = ['scroll'];
export const BUILT_IN_VIDEO_EVENTS = [
  'video_start',
  'video_progress',
  'video_complete'
];
export const BUILT_IN_EVENTS = [
  ...BUILT_IN_SCROLL_EVENT,
  ...BUILT_IN_VIDEO_EVENTS
];

/** Default consent status applied to all GTM tags in exported containers. */
export const CONSENT_STATUS_NOT_NEEDED = 'NOT_NEEDED';
