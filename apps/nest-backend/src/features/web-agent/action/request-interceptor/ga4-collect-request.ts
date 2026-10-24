/**
 * Splits the requests the Google tag (gtag.js, or GA4 tags in Tag Manager)
 * sends to GA4 into one entry per event.
 *
 * Google does not document this wire format. The rules below match requests
 * recorded from the official gtag.js (see gtag-collect-hits.spec-helpers.ts):
 * - A single short event is sent with every parameter in the URL query.
 * - Events fired close together are batched: request-level parameters stay in
 *   the URL and each event is one line of the POST body.
 * - A single event whose URL would grow past ~2,000 characters is sent the same
 *   way, as a one-line body.
 *
 * What Google does document is where the requests may go: the Google tag
 * connects to `*.google-analytics.com` and `*.google.com`
 * (https://developers.google.com/tag-platform/security/guides/csp), to a
 * first-party measurement path behind Google tag gateway
 * (https://developers.google.com/tag-platform/tag-manager/gateway), or to a
 * server-side container. The endpoint is therefore recognised by its path and
 * protocol version rather than its host.
 */

/** Matches the GA4 collection path on any host, for CDP `Fetch` patterns. */
export const GA4_COLLECT_URL_PATTERN = '*/g/collect*';

const GA4_COLLECT_PATH = '/g/collect';
const GA4_PROTOCOL_VERSION = '2';

export interface Ga4CollectEvent {
  /** Collection endpoint without the query string. */
  endpoint: string;
  /** `tid`: the measurement ID the event was sent to. */
  measurementId: string;
  /** `en`: the event name, exactly as sent. */
  eventName: string;
  /** Position of this event in the request and the number of events in it. */
  batchIndex: number;
  batchSize: number;
  /**
   * The request rewritten as one URL holding the request-level parameters plus
   * this event's parameters, keeping the original percent-encoding.
   */
  normalizedUrl: string;
}

/**
 * Splits one collect request into its events, in the order sent. Returns an
 * empty array for a URL that is not a GA4 (`v=2`) collect endpoint. Never
 * throws.
 */
export function parseGa4CollectRequest(
  url: string,
  body = ''
): Ga4CollectEvent[] {
  const parsed = tryParseUrl(url);
  if (!parsed || !isGa4CollectEndpoint(parsed)) {
    return [];
  }

  const endpoint = `${parsed.origin}${parsed.pathname}`;
  const requestSegments = splitQuery(parsed.search.slice(1));
  const eventSegmentGroups = body
    .split(/\r?\n/)
    .map(splitQuery)
    .filter((segments) => hasKey(segments, 'en'));

  if (hasKey(requestSegments, 'en')) {
    eventSegmentGroups.unshift([]);
  }

  return eventSegmentGroups.map((eventSegments, batchIndex) => {
    const segments = mergeSegments(requestSegments, eventSegments);
    const params = new URLSearchParams(segments.join('&'));
    return {
      endpoint,
      measurementId: params.get('tid') ?? '',
      eventName: params.get('en') ?? '',
      batchIndex,
      batchSize: eventSegmentGroups.length,
      normalizedUrl: `${endpoint}?${segments.join('&')}`
    };
  });
}

function isGa4CollectEndpoint(url: URL): boolean {
  return (
    url.pathname.endsWith(GA4_COLLECT_PATH) &&
    url.searchParams.get('v') === GA4_PROTOCOL_VERSION
  );
}

function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function splitQuery(query: string): string[] {
  return query.split('&').filter((segment) => segment.length > 0);
}

function segmentKey(segment: string): string {
  const rawKey = segment.split('=', 1)[0].replaceAll('+', ' ');
  try {
    return decodeURIComponent(rawKey);
  } catch {
    return rawKey;
  }
}

function hasKey(segments: string[], key: string): boolean {
  return segments.some((segment) => segmentKey(segment) === key);
}

/** Event-level parameters win over request-level ones with the same key. */
function mergeSegments(
  requestSegments: string[],
  eventSegments: string[]
): string[] {
  const eventKeys = new Set(eventSegments.map(segmentKey));
  return [
    ...requestSegments.filter((segment) => !eventKeys.has(segmentKey(segment))),
    ...eventSegments
  ];
}
