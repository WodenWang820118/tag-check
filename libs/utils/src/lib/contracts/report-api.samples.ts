import type {
  AbstractTestEvent,
  Jsonified,
  ReportDetailResponse
} from '../types/tag-check';

/**
 * Responses of the reports API as they arrive over HTTP (dates are ISO
 * strings), recorded from an add_to_cart run of the example project.
 *
 * Backend specs check that the DTOs still produce exactly this shape, and
 * frontend specs feed these samples to the code that reads the responses, so
 * a change on either side fails a test until both agree. `satisfies` keeps
 * the samples in line with the shared types.
 */

/** One item of GET /reports/:projectSlug. */
export const REPORT_LIST_ITEM_SAMPLE = {
  id: 3,
  eventId: '0fd9ce76-5792-4191-8fba-8bb20e3013bc',
  testName: 'GA4 event - add_to_cart',
  eventName: 'add_to_cart',
  stopNavigation: false,
  message: 'Valid',
  createdAt: '2026-10-20T06:18:46.000Z',
  updatedAt: '2026-10-20T06:21:19.000Z',
  hasRecording: true,
  passed: true,
  requestPassed: true
} satisfies Jsonified<AbstractTestEvent>;

/** Body of GET /reports/:projectSlug/:eventId. */
export const REPORT_DETAIL_SAMPLE = {
  testEvent: {
    id: 3,
    eventId: '0fd9ce76-5792-4191-8fba-8bb20e3013bc',
    testName: 'GA4 event - add_to_cart',
    eventName: 'add_to_cart',
    stopNavigation: false,
    message: 'Valid',
    createdAt: '2026-10-20T06:18:46.000Z',
    updatedAt: '2026-10-20T06:21:19.000Z',
    passed: true,
    requestPassed: true
  },
  testEventDetails: {
    id: 7,
    requestPassed: true,
    passed: true,
    rawRequest:
      'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK&en=add_to_cart&pr1=idcity001~nmSwitzerland~qt1~pr799&epn.value=799&cu=USD',
    destinationUrl:
      'https://ng-gtm-sample.vercel.app/product/details/switzerland',
    dataLayer: [
      {
        event: 'add_to_cart',
        ecommerce: {
          value: 799,
          currency: 'USD',
          items: [
            {
              item_id: 'city001',
              item_name: 'Switzerland',
              quantity: 1,
              price: 799
            }
          ]
        }
      }
    ],
    createdAt: '2026-10-20T06:21:19.000Z',
    updatedAt: '2026-10-20T06:21:19.000Z'
  },
  testImage: {
    id: 7,
    imageName: 'screenshot.png',
    imageSize: 780605,
    createdAt: '2026-10-20T06:21:19.000Z',
    updatedAt: '2026-10-20T06:21:19.000Z'
  }
} satisfies Jsonified<ReportDetailResponse>;

/**
 * The structure of a JSON value: object keys (sorted) with the structure of
 * their values, the structure of an array's first item, and the type of
 * anything else. Contract specs compare structures, not values.
 */
export function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.length > 0 ? [shapeOf(value[0])] : [];
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shapeOf((value as Record<string, unknown>)[key])])
    );
  }
  return value === null ? 'null' : typeof value;
}
