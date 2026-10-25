/**
 * Events tag-build tracks with Tag Manager's built-in triggers instead of a
 * custom event trigger. A spec with one of these events asks for the scroll
 * or video setup; sites do not push them to the data layer themselves.
 */
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

/** Name of the Scroll Depth trigger that fires the GA4 scroll tag. */
export const SCROLL_TRIGGER_NAME = 'event scroll';

/** Name of the YouTube Video trigger that fires the GA4 video tags. */
export const VIDEO_TRIGGER_NAME = 'event youtube video';

/** Name of the Constant variable that holds the GA4 measurement ID. */
export const MEASUREMENT_ID_VARIABLE_NAME = 'CONST - Measurement ID';

/** Default consent status applied to all GTM tags in exported containers. */
export const CONSENT_STATUS_NOT_NEEDED = 'NOT_NEEDED';
