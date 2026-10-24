/**
 * The GA4 event name of a test event ID: test event IDs are
 * `<event name>_<uuid>`, so a trailing `_<uuid>` is removed. An ID without
 * that suffix is returned unchanged.
 */
export function extractEventNameFromId(eventId: string) {
  return eventId.replace(
    /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ''
  );
}
