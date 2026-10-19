import { describe, expect, it } from 'vitest';
import { parseGa4CollectRequest } from './ga4-collect-request';
import {
  GTAG_ADD_TO_CART_HIT,
  GTAG_BATCHED_HIT,
  GTAG_LONG_VIEW_ITEM_LIST_HIT
} from './gtag-collect-hits.spec-helpers';

describe('parseGa4CollectRequest', () => {
  it('returns a single-event request unchanged', () => {
    const events = parseGa4CollectRequest(GTAG_ADD_TO_CART_HIT.url);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      endpoint: 'https://www.google-analytics.com/g/collect',
      measurementId: 'G-TAGCHECK01',
      eventName: 'add_to_cart',
      batchIndex: 0,
      batchSize: 1,
      normalizedUrl: GTAG_ADD_TO_CART_HIT.url
    });
  });

  it('splits a batched request into one event per body line', () => {
    const events = parseGa4CollectRequest(
      GTAG_BATCHED_HIT.url,
      GTAG_BATCHED_HIT.body
    );

    expect(events.map((event) => event.eventName)).toEqual([
      'select_content',
      'login',
      'search'
    ]);
    expect(events.map((event) => event.batchIndex)).toEqual([0, 1, 2]);
    expect(events.every((event) => event.batchSize === 3)).toBe(true);
    expect(
      events.every((event) => event.measurementId === 'G-TAGCHECK01')
    ).toBe(true);
  });

  it('builds each batched event URL from the shared parameters and its own line only', () => {
    const login = parseGa4CollectRequest(
      GTAG_BATCHED_HIT.url,
      GTAG_BATCHED_HIT.body
    )[1];
    const params = new URL(login.normalizedUrl).searchParams;

    expect(login.normalizedUrl.startsWith(GTAG_BATCHED_HIT.url)).toBe(true);
    expect(params.getAll('en')).toEqual(['login']);
    expect(params.get('ep.method')).toBe('Google');
    expect(params.has('ep.search_term')).toBe(false);
    expect(params.get('dt')).toBe('Shoes & Bags #1');
  });

  it('reads a single event that gtag.js moved into the POST body', () => {
    const events = parseGa4CollectRequest(
      GTAG_LONG_VIEW_ITEM_LIST_HIT.url,
      GTAG_LONG_VIEW_ITEM_LIST_HIT.body
    );

    expect(
      new URL(GTAG_LONG_VIEW_ITEM_LIST_HIT.url).searchParams.has('en')
    ).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('view_item_list');
    expect(new URL(events[0].normalizedUrl).searchParams.has('pr6')).toBe(true);
  });

  it('accepts CRLF-separated body lines', () => {
    const events = parseGa4CollectRequest(
      'https://www.google-analytics.com/g/collect?v=2&tid=G-A',
      'en=first&ep.a=1\r\nen=second&ep.b=2\r\n'
    );

    expect(events.map((event) => event.eventName)).toEqual(['first', 'second']);
  });

  it('lets event-level parameters override request-level ones', () => {
    const [event] = parseGa4CollectRequest(
      'https://www.google-analytics.com/g/collect?v=2&tid=G-A&dt=Shared',
      'en=page_view&dt=Own%20title'
    );
    const params = new URL(event.normalizedUrl).searchParams;

    expect(params.getAll('dt')).toEqual(['Own title']);
  });

  it.each([
    'https://region1.google-analytics.com/g/collect',
    'https://region1.analytics.google.com/g/collect',
    'https://www.google.com/g/collect',
    'https://sgtm.example.com/g/collect',
    'https://www.example.com/metrics/g/collect'
  ])('recognises the GA4 endpoint at %s', (endpoint) => {
    const [event] = parseGa4CollectRequest(
      `${endpoint}?v=2&tid=G-A&en=page_view`
    );

    expect(event).toMatchObject({ endpoint, eventName: 'page_view' });
  });

  it.each([
    [
      'a Universal Analytics hit',
      'https://www.google-analytics.com/collect?v=1&t=pageview&tid=UA-1-1'
    ],
    [
      'a Measurement Protocol request',
      'https://www.google-analytics.com/mp/collect?measurement_id=G-A&api_secret=x'
    ],
    [
      'a collect path without protocol version 2',
      'https://www.google-analytics.com/g/collect?tid=G-A&en=page_view'
    ],
    [
      'another endpoint',
      'https://example.com/api/collect?v=2&tid=G-A&en=page_view'
    ],
    ['an invalid URL', 'not a url']
  ])('ignores %s', (_label, url) => {
    expect(parseGa4CollectRequest(url)).toEqual([]);
  });

  it('returns no events for a request without an event name', () => {
    expect(
      parseGa4CollectRequest(
        'https://stats.g.doubleclick.net/g/collect?v=2&tid=G-A&cid=1.2'
      )
    ).toEqual([]);
  });
});
