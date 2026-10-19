import { describe, it, expect, beforeEach } from 'vitest';
import { Ga4RequestMatcher } from './ga4-request-matcher.service';
import { parseGa4CollectRequest } from './ga4-collect-request';
import {
  GTAG_BATCHED_HIT,
  GTAG_LONG_VIEW_ITEM_LIST_HIT
} from './gtag-collect-hits.spec-helpers';

describe('Ga4RequestMatcher', () => {
  let matcher: Ga4RequestMatcher;

  beforeEach(() => {
    matcher = new Ga4RequestMatcher();
  });

  it('matches GA4 GET collect request with en and tid', () => {
    const eventName = 'purchase';
    const measurementId = 'G-TEST123';
    const url = `https://www.google-analytics.com/g/collect?v=2&en=${eventName}&tid=${measurementId}`;
    expect(
      matcher.isMatchingGa4Request(url, '', eventName, measurementId)
    ).toBe(true);
  });

  it('does not treat a Measurement Protocol JSON body as a web collect request', () => {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=G-POST123`;
    const body = JSON.stringify({
      client_id: '1.2',
      events: [{ name: 'add_to_cart' }]
    });
    expect(
      matcher.isMatchingGa4Request(url, body, 'add_to_cart', 'G-POST123')
    ).toBe(false);
  });

  it('returns false for non-GA endpoints', () => {
    const eventName = 'purchase';
    const measurementId = 'G-TEST123';
    const url = `https://example.com/api/collect?en=${eventName}&tid=${measurementId}`;
    expect(
      matcher.isMatchingGa4Request(url, '', eventName, measurementId)
    ).toBe(false);
  });

  it('matches a complex GA4 GET URL with many params', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK&gtm=45je5931v9171567282z89168785492za200zb9168785492zd9168785492&_p=1757318410354&gcd=13l3l3l3l3l1&npa=1&dma=0&cid=2005547773.1757318411&ul=zh-tw&sr=800x600&uaa=&uab=&uafvl=&uamb=0&uam=&uap=&uapv=&uaw=0&are=1&frm=0&pscdl=&_eu=AAAAAAQ&ngs=1&_s=2&tag_exp=101509157~103116026~103200004~103233427~104527907~104528501~104684208~104684211~104948813&dr=&dl=&sid=1757318410&sct=1&seg=0&dt=Ng%20GTM%20Integration%20App&_tu=AAg&en=view_promotion&pr1=idcity001~nmSwitzerland&ep.debug_mode=false&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&ep.promotion_id=city001&ep.promotion_name=Switzerland&tfd=4203`;
    const eventName = 'view_promotion';
    const measurementId = 'G-8HKQR5ZBSK';
    expect(
      matcher.isMatchingGa4Request(url, '', eventName, measurementId)
    ).toBe(true);
  });

  it('does not match when expected event name contains a prefix (strict match)', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&en=view_promotion&tid=G-8HKQR5ZBSK`;
    const eventName = 'GA4 event - view_promotion';
    const measurementId = 'G-8HKQR5ZBSK';
    expect(
      matcher.isMatchingGa4Request(url, '', eventName, measurementId)
    ).toBe(false);
  });

  it('compares event names case-sensitively, as GA4 does', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&en=Purchase&tid=G-A`;
    expect(matcher.isMatchingGa4Request(url, '', 'purchase', 'G-A')).toBe(
      false
    );
  });

  it('finds an event inside a batched request', () => {
    const events = parseGa4CollectRequest(
      GTAG_BATCHED_HIT.url,
      GTAG_BATCHED_HIT.body
    );

    expect(matcher.findMatchingEvent(events, 'login', 'G-TAGCHECK01')).toBe(
      events[1]
    );
  });

  it('finds an event that gtag.js moved into the POST body', () => {
    expect(
      matcher.isMatchingGa4Request(
        GTAG_LONG_VIEW_ITEM_LIST_HIT.url,
        GTAG_LONG_VIEW_ITEM_LIST_HIT.body,
        'view_item_list',
        'G-TAGCHECK01'
      )
    ).toBe(true);
  });

  it('ignores surrounding whitespace and case in the expected measurement ID', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&en=login&tid=G-ABC123`;
    expect(matcher.isMatchingGa4Request(url, '', 'login', ' g-abc123 ')).toBe(
      true
    );
  });

  it('accepts any measurement ID when none is expected', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&en=login&tid=G-ABC123`;
    expect(matcher.isMatchingGa4Request(url, '', 'login', '')).toBe(true);
  });

  it('rejects events sent to a different measurement ID', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&en=login&tid=G-OTHER`;
    expect(matcher.isMatchingGa4Request(url, '', 'login', 'G-ABC123')).toBe(
      false
    );
  });
});
