import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestInterceptorService } from './request-interceptor.service';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { firstValueFrom } from 'rxjs';

describe('RequestInterceptorService', () => {
  let service: RequestInterceptorService;
  let mockDataLayerService: Partial<DataLayerService>;

  beforeEach(() => {
    mockDataLayerService = {
      updateSelfDataLayerAlgorithm: vi.fn()
    } as unknown as Partial<DataLayerService>;

    service = new RequestInterceptorService(
      mockDataLayerService as DataLayerService
    );
  });

  it('should match GA4 GET collect request with en and tid', () => {
    const eventName = 'purchase';
    const measurementId = 'G-TEST123';
    const url = `https://www.google-analytics.com/g/collect?v=2&en=${eventName}&tid=${measurementId}`;

    const internals = service as unknown as RequestInterceptorService & {
      isMatchingGa4Request(
        url: string,
        postData: string,
        eventName: string,
        measurementId: string
      ): boolean;
    };
    const matched = internals.isMatchingGa4Request(
      url,
      '',
      eventName,
      measurementId
    );
    expect(matched).toBe(true);
  });

  it('should match GA4 POST JSON body with measurement_id and events[0].name', () => {
    const eventName = 'add_to_cart';
    const measurementId = 'G-POST123';
    const url = `https://www.google-analytics.com/g/collect`;
    const body = JSON.stringify({
      measurement_id: measurementId,
      events: [{ name: eventName }]
    });

    const internals2 = service as unknown as RequestInterceptorService & {
      isMatchingGa4Request(
        url: string,
        postData: string,
        eventName: string,
        measurementId: string
      ): boolean;
    };
    const matched = internals2.isMatchingGa4Request(
      url,
      body,
      eventName,
      measurementId
    );
    expect(matched).toBe(true);
  });

  it('should return false for non-GA endpoints', () => {
    const eventName = 'purchase';
    const measurementId = 'G-TEST123';
    const url = `https://example.com/api/collect?en=${eventName}&tid=${measurementId}`;

    const internals3 = service as unknown as RequestInterceptorService & {
      isMatchingGa4Request(
        url: string,
        postData: string,
        eventName: string,
        measurementId: string
      ): boolean;
    };
    const matched = internals3.isMatchingGa4Request(
      url,
      '',
      eventName,
      measurementId
    );
    expect(matched).toBe(false);
  });

  it('should match the provided GA4 GET URL with en=view_promotion and matching tid', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&tid=G-8HK542DQMG&gtm=45je5931v9171567282z89168785492za200zb9168785492zd9168785492&_p=1757318410354&gcd=13l3l3l3l3l1&npa=1&dma=0&cid=2005547773.1757318411&ul=zh-tw&sr=800x600&uaa=&uab=&uafvl=&uamb=0&uam=&uap=&uapv=&uaw=0&are=1&frm=0&pscdl=&_eu=AAAAAAQ&ngs=1&_s=2&tag_exp=101509157~103116026~103200004~103233427~104527907~104528501~104684208~104684211~104948813&dr=&dl=&sid=1757318410&sct=1&seg=0&dt=Ng%20GTM%20Integration%20App&_tu=AAg&en=view_promotion&pr1=idcity001~nmSwitzerland&ep.debug_mode=false&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&ep.promotion_id=city001&ep.promotion_name=Switzerland&tfd=4203`;
    const eventName = 'view_promotion';
    const measurementId = 'G-8HK542DQMG';
    const internals = service as unknown as RequestInterceptorService & {
      isMatchingGa4Request(
        url: string,
        postData: string,
        eventName: string,
        measurementId: string
      ): boolean;
    };
    const matched = internals.isMatchingGa4Request(
      url,
      '',
      eventName,
      measurementId
    );
    expect(matched).toBe(true);
  });

  it('should NOT match when expected event name contains a prefix (strict match)', () => {
    const url = `https://www.google-analytics.com/g/collect?v=2&en=view_promotion&tid=G-8HK542DQMG`;
    const eventName = 'GA4 event - view_promotion';
    const measurementId = 'G-8HK542DQMG';
    const internals = service as unknown as RequestInterceptorService & {
      isMatchingGa4Request(
        url: string,
        postData: string,
        eventName: string,
        measurementId: string
      ): boolean;
    };
    const matched = internals.isMatchingGa4Request(
      url,
      '',
      eventName,
      measurementId
    );
    expect(matched).toBe(false);
  });

  it('getRawRequest should time out and return empty string when no request is set', async () => {
    const raw$ = service.getRawRequest({ timeoutMs: 50 });
    // firstValueFrom will resolve to '' after timeout inside the operator
    const val = await firstValueFrom(raw$);
    expect(val).toBe('');
  });

  it('setRawRequest and getRawRequest should return the value when set', async () => {
    const valToSet =
      'https://www.google-analytics.com/g/collect?v=2&en=test&tid=G-123';
    // subscribe to the raw request and ensure we get the new value
    const p = firstValueFrom(service.getRawRequest({ timeoutMs: 500 }));
    service.setRawRequest(valToSet);
    const val = await p;
    expect(val).toBe(valToSet);

    // clear it and ensure subsequent get returns '' (via timeout)
    service.clearRawRequest();
    const afterClear = await firstValueFrom(
      service.getRawRequest({ timeoutMs: 50 })
    );
    expect(afterClear).toBe('');
  });
});
