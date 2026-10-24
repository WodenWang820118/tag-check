import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestInterceptorService } from './request-interceptor.service';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { Ga4RequestMatcher } from './ga4-request-matcher.service';
import { firstValueFrom, toArray } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {
  GTAG_BATCHED_HIT,
  GTAG_LONG_VIEW_ITEM_LIST_HIT
} from './gtag-collect-hits.spec-helpers';

describe('RequestInterceptorService', () => {
  let service: RequestInterceptorService;
  let mockDataLayerService: Partial<DataLayerService>;

  beforeEach(() => {
    mockDataLayerService = {
      updateSelfDataLayerAlgorithm: vi.fn()
    } as unknown as Partial<DataLayerService>;

    service = new RequestInterceptorService(
      mockDataLayerService as DataLayerService,
      new Ga4RequestMatcher()
    );
  });

  it('captures through the page Fetch domain and releases every paused request', async () => {
    const fetchSession = createMockCdpSession();
    const page = createMockPage(fetchSession);

    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'view_item',
      'G-A'
    );

    expect(fetchSession.send).toHaveBeenCalledWith('Fetch.enable', {
      patterns: [{ urlPattern: '*/g/collect*', requestStage: 'Request' }]
    });

    fetchSession.emit('Fetch.requestPaused', {
      requestId: 'r1',
      request: {
        url: 'https://www.google-analytics.com/g/collect?v=2&en=page_view&tid=G-A'
      }
    });
    fetchSession.emit('Fetch.requestPaused', {
      requestId: 'r2',
      request: {
        url: 'https://www.google-analytics.com/g/collect?v=2&en=view_item&tid=G-A'
      }
    });

    await expect(
      firstValueFrom(handle.rawRequest$.pipe(timeout(500)))
    ).resolves.toBe(
      'https://www.google-analytics.com/g/collect?v=2&en=view_item&tid=G-A'
    );
    expect(fetchSession.send).toHaveBeenCalledWith('Fetch.continueRequest', {
      requestId: 'r1'
    });
    expect(fetchSession.send).toHaveBeenCalledWith('Fetch.continueRequest', {
      requestId: 'r2'
    });
    expect(page.evaluate).toHaveBeenCalledTimes(1);

    await handle.stop();
  });

  it('emits only the matched event of a batched request', async () => {
    const fetchSession = createMockCdpSession();
    const page = createMockPage(fetchSession);
    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'login',
      'G-TAGCHECK01'
    );

    fetchSession.emit('Fetch.requestPaused', {
      requestId: 'r1',
      request: { url: GTAG_BATCHED_HIT.url, postData: GTAG_BATCHED_HIT.body }
    });
    await handle.stop();

    const emitted = await firstValueFrom(handle.rawRequest$.pipe(toArray()));
    expect(emitted).toHaveLength(1);
    const params = new URL(emitted[0]).searchParams;
    expect(params.get('en')).toBe('login');
    expect(params.get('ep.method')).toBe('Google');
    expect(params.has('ep.search_term')).toBe(false);
  });

  it('reads post data sent as base64 postDataEntries', async () => {
    const fetchSession = createMockCdpSession();
    const page = createMockPage(fetchSession);
    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'view_item_list',
      'G-TAGCHECK01'
    );

    fetchSession.emit('Fetch.requestPaused', {
      requestId: 'r1',
      request: {
        url: GTAG_LONG_VIEW_ITEM_LIST_HIT.url,
        postDataEntries: [
          {
            bytes: Buffer.from(GTAG_LONG_VIEW_ITEM_LIST_HIT.body).toString(
              'base64'
            )
          }
        ]
      }
    });

    const captured = await firstValueFrom(
      handle.rawRequest$.pipe(timeout(500))
    );
    expect(new URL(captured).searchParams.get('en')).toBe('view_item_list');
    await handle.stop();
  });

  it('isolates concurrent capture handles by predicate and CDP session', async () => {
    const firstSession = createMockCdpSession();
    const secondSession = createMockCdpSession();
    const page = createMockPage(firstSession, secondSession);

    const firstHandle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'view_item',
      'G-A'
    );
    const secondHandle = await service.setupInterception(
      page as never,
      'project',
      'event-b',
      'purchase',
      'G-B'
    );

    const firstRequest = firstValueFrom(
      firstHandle.rawRequest$.pipe(timeout(500))
    );
    const secondRequest = firstValueFrom(
      secondHandle.rawRequest$.pipe(timeout(500))
    );

    firstSession.emit('Fetch.requestPaused', {
      requestId: 'r1',
      request: {
        url: 'https://www.google-analytics.com/g/collect?v=2&en=view_item&tid=G-A'
      }
    });
    secondSession.emit('Fetch.requestPaused', {
      requestId: 'r2',
      request: {
        url: 'https://www.google-analytics.com/g/collect?v=2&en=purchase&tid=G-B'
      }
    });

    await expect(firstRequest).resolves.toContain('view_item');
    await expect(secondRequest).resolves.toContain('purchase');

    await firstHandle.stop();
    await firstHandle.stop();
    expect(firstSession.off).toHaveBeenCalledWith(
      'Fetch.requestPaused',
      expect.any(Function)
    );
    expect(firstSession.send).toHaveBeenCalledWith('Fetch.disable');
    expect(firstSession.detach).toHaveBeenCalledTimes(1);
    expect(secondSession.detach).not.toHaveBeenCalled();
    expect(firstHandle.rawRequest$.isStopped).toBe(true);
  });

  it('replays a captured request to a subscriber that attaches after the CDP event', async () => {
    const fetchSession = createMockCdpSession();
    const page = createMockPage(fetchSession);

    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'view_item',
      'G-A'
    );

    fetchSession.emit('Fetch.requestPaused', {
      requestId: 'r1',
      request: {
        url: 'https://www.google-analytics.com/g/collect?v=2&en=view_item&tid=G-A'
      }
    });

    await expect(
      firstValueFrom(handle.rawRequest$.pipe(timeout(500)))
    ).resolves.toContain('view_item');

    await handle.stop();
  });

  it('falls back to the page Network domain when Fetch is unavailable', async () => {
    const fetchSession = createMockCdpSession({
      'Fetch.enable': () => Promise.reject(new Error('not supported'))
    });
    const networkSession = createMockCdpSession({
      'Network.getRequestPostData': () =>
        Promise.resolve({ postData: GTAG_BATCHED_HIT.body })
    });
    const page = createMockPage(fetchSession, networkSession);

    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'search',
      'G-TAGCHECK01'
    );

    expect(fetchSession.detach).toHaveBeenCalledTimes(1);
    expect(networkSession.send).toHaveBeenCalledWith('Network.enable', {
      maxPostDataSize: 1024 * 1024
    });

    networkSession.emit('Network.requestWillBeSent', {
      requestId: 'r1',
      request: { url: GTAG_BATCHED_HIT.url, hasPostData: true }
    });

    const captured = await firstValueFrom(
      handle.rawRequest$.pipe(timeout(500))
    );
    expect(new URL(captured).searchParams.get('en')).toBe('search');

    await handle.stop();
    expect(networkSession.send).toHaveBeenCalledWith('Network.disable');
    expect(networkSession.detach).toHaveBeenCalledTimes(1);
  });

  it('detaches the Network session when the fallback cannot be enabled', async () => {
    const fetchSession = createMockCdpSession({
      'Fetch.enable': () => Promise.reject(new Error('not supported'))
    });
    const networkSession = createMockCdpSession({
      'Network.enable': () => Promise.reject(new Error('Target closed'))
    });
    const page = createMockPage(fetchSession, networkSession);

    await expect(
      service.setupInterception(
        page as never,
        'project',
        'event-a',
        'search',
        'G-TAGCHECK01'
      )
    ).rejects.toThrow('Target closed');

    expect(networkSession.detach).toHaveBeenCalledTimes(1);
    expect(networkSession.off).toHaveBeenCalledWith(
      'Network.requestWillBeSent',
      expect.any(Function)
    );
  });

  it('reports the GA4 events it saw when nothing matched', async () => {
    const warn = vi
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => undefined);
    const fetchSession = createMockCdpSession();
    const page = createMockPage(fetchSession);
    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'purchase',
      'G-EXPECTED'
    );

    fetchSession.emit('Fetch.requestPaused', {
      requestId: 'r1',
      request: {
        url: 'https://region1.analytics.google.com/g/collect?v=2&en=purchase&tid=G-OTHER'
      }
    });
    await handle.stop();

    expect(warn).toHaveBeenCalledWith(
      'No GA4 request matched en=purchase tid=G-EXPECTED. GA4 events seen while capturing: purchase → G-OTHER'
    );
  });

  it('warns when the expected event name breaks GA4 naming rules', async () => {
    const warn = vi
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => undefined);
    const page = createMockPage(createMockCdpSession());

    const handle = await service.setupInterception(
      page as never,
      'project',
      'event-a',
      'GA4 event - view_promotion',
      'G-A'
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('"GA4 event - view_promotion" can never match')
    );
    await handle.stop();
  });
});

type MockCdpSession = ReturnType<typeof createMockCdpSession>;

function createMockPage(...sessions: MockCdpSession[]) {
  const pending = [...sessions];
  return {
    setCacheEnabled: vi.fn().mockResolvedValue(undefined),
    setBypassServiceWorker: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue([]),
    createCDPSession: vi.fn(async () => pending.shift())
  };
}

function createMockCdpSession(
  responses: Record<string, (params?: unknown) => Promise<unknown>> = {}
) {
  const handlers = new Map<string, (payload: unknown) => void>();
  return {
    send: vi.fn((method: string, params?: unknown) =>
      responses[method] ? responses[method](params) : Promise.resolve(undefined)
    ),
    detach: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlers.set(event, handler);
    }),
    off: vi.fn((event: string, handler: (payload: unknown) => void) => {
      if (handlers.get(event) === handler) {
        handlers.delete(event);
      }
    }),
    emit(event: string, payload: unknown) {
      handlers.get(event)?.(payload);
    }
  };
}
