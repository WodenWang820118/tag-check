import { describe, it, expect, vi } from 'vitest';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { DataLayerService } from './action/web-monitoring/data-layer/data-layer.service';
import { ActionService } from './action/action.service';
import { RequestInterceptorService } from './action/request-interceptor/request-interceptor.service';
import { EMPTY, Subject, of } from 'rxjs';
import type { Page } from 'puppeteer';
import type { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import type { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';

// Sample data layer JSON as provided in the attachment
const sampleDataLayer = [
  {
    'gtm.start': 1754891744563,
    event: 'gtm.js',
    'gtm.uniqueEventId': 3
  },
  {
    event: 'gtm.dom',
    'gtm.uniqueEventId': 4
  },
  {
    event: 'componentsLoaded',
    'gtm.uniqueEventId': 5
  },
  {
    event: 'gtm.load',
    'gtm.uniqueEventId': 6
  },
  {
    event: 'gtm.triggerGroup',
    'gtm.triggers': '168785492_202',
    'gtm.uniqueEventId': 12
  },
  {
    event: 'gtm.historyChange',
    'gtm.historyChangeSource': 'replaceState',
    'gtm.oldUrlFragment': '',
    'gtm.newUrlFragment': '',
    'gtm.oldHistoryState': null,
    'gtm.newHistoryState': { navigationId: 1 },
    'gtm.oldUrl': 'https://gtm-integration-sample.netlify.app/',
    'gtm.newUrl': 'https://gtm-integration-sample.netlify.app/home',
    'gtm.uniqueEventId': 8
  },
  {
    event: 'page_view',
    page_path: '/',
    page_title: 'Home',
    page_location: 'https://gtm-integration-sample.netlify.app/home',
    'gtm.uniqueEventId': 9
  },
  {
    ecommerce: null
  },
  {
    event: 'view_promotion',
    ecommerce: {
      promotion_id: 'city001',
      promotion_name: 'Switzerland',
      creative_name: 'travel_slide',
      creative_slot: 'featured_attributor',
      items: [{ item_id: 'city001', item_name: 'Switzerland' }]
    },
    'gtm.uniqueEventId': 10
  },
  {
    event: 'update_consent',
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'denied',
    'gtm.uniqueEventId': 11
  }
];

const emptyApplication = {
  localStorage: { data: [] },
  cookie: { data: [] }
} satisfies EventInspectionPresetDto['application'];

function createPage() {
  return {
    authenticate: vi.fn().mockResolvedValue(undefined),
    waitForNavigation: vi.fn().mockRejectedValue(new Error('no navigation')),
    url: vi.fn(() => 'https://example.test/thank-you')
  };
}

function createServiceHarness(
  overrides: {
    action?: Partial<ActionService>;
    dataLayer?: Partial<DataLayerService>;
    interceptor?: Partial<RequestInterceptorService>;
    testEventRepository?: { getEntityByEventId?: ReturnType<typeof vi.fn> };
    page?: ReturnType<typeof createPage>;
  } = {}
) {
  const action = {
    performOperation: vi.fn().mockResolvedValue(undefined),
    ...overrides.action
  } as unknown as ActionService;

  const dataLayer = {
    initSelfDataLayer: vi.fn().mockResolvedValue(undefined),
    updateSelfDataLayer: vi.fn().mockResolvedValue(undefined),
    getMyDataLayer: vi.fn().mockResolvedValue([]),
    ...overrides.dataLayer
  } as unknown as DataLayerService;

  const defaultStop = vi.fn().mockResolvedValue(undefined);
  const interceptor = {
    setupInterception: vi.fn().mockResolvedValue({
      rawRequest$: of(''),
      stop: defaultStop
    }),
    getRawRequest: vi.fn(),
    clearRawRequest: vi.fn(),
    ...overrides.interceptor
  } as unknown as RequestInterceptorService;

  const testEventRepository = {
    getEntityByEventId: vi.fn().mockResolvedValue({ eventName: 'purchase' }),
    ...overrides.testEventRepository
  };
  const page = overrides.page ?? createPage();
  const service = new WebAgentUtilsService(
    action,
    dataLayer,
    interceptor,
    testEventRepository as unknown as TestEventRepositoryService
  );

  return {
    action,
    dataLayer,
    defaultStop,
    interceptor,
    page,
    service,
    testEventRepository,
    performTest: (
      options: {
        captureRequest?: boolean;
        requestCaptureTimeoutMs?: number;
      } = {}
    ) =>
      service.performTest({
        page: page as unknown as Page,
        projectSlug: 'project',
        eventId: 'event-id',
        measurementId: 'G-TEST',
        credentials: { username: '', password: '' },
        captureRequest: options.captureRequest ?? true,
        application: emptyApplication,
        options: { requestCaptureTimeoutMs: options.requestCaptureTimeoutMs }
      })
  };
}

describe('WebAgentUtilsService.performTest data layer', () => {
  it('removes gtm.uniqueEventId from each data layer event', async () => {
    const getMyDataLayer = vi.fn().mockResolvedValue(sampleDataLayer);
    const { dataLayer, performTest } = createServiceHarness({
      dataLayer: { getMyDataLayer }
    });

    const expected = sampleDataLayer.map((obj) => {
      const copy = { ...obj } as Record<string, unknown>;
      delete copy['gtm.uniqueEventId'];
      return copy;
    });

    const result = await performTest({ captureRequest: false });

    expect(result.dataLayer).toEqual(expected);
    expect(dataLayer.getMyDataLayer).toHaveBeenCalledWith(
      'project',
      'event-id'
    );
  });
});

describe('WebAgentUtilsService.performTest request capture', () => {
  it('uses the per-interception handle instead of the legacy rawRequest subject', async () => {
    const rawRequest =
      'https://www.google-analytics.com/g/collect?v=2&en=purchase&tid=G-TEST';
    const stop = vi.fn().mockResolvedValue(undefined);
    const { interceptor, performTest } = createServiceHarness({
      interceptor: {
        setupInterception: vi.fn().mockResolvedValue({
          rawRequest$: of(rawRequest),
          stop
        })
      }
    });

    const result = await performTest();

    expect(interceptor.setupInterception).toHaveBeenCalledTimes(1);
    expect(interceptor.getRawRequest).not.toHaveBeenCalled();
    expect(interceptor.clearRawRequest).not.toHaveBeenCalled();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(result.eventRequest).toBe(rawRequest);
  });

  it('does not set up request interception when captureRequest is false', async () => {
    const { interceptor, performTest } = createServiceHarness();

    await performTest({ captureRequest: false });

    expect(interceptor.setupInterception).not.toHaveBeenCalled();
  });

  it('stops request interception when the action fails', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    const { performTest } = createServiceHarness({
      action: {
        performOperation: vi.fn().mockRejectedValue(new Error('action failed'))
      },
      interceptor: {
        setupInterception: vi.fn().mockResolvedValue({
          rawRequest$: of(''),
          stop
        })
      }
    });

    await expect(performTest()).rejects.toThrow(/action failed/);

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('times out and stops request interception when no matching request is captured', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    const { performTest } = createServiceHarness({
      interceptor: {
        setupInterception: vi.fn().mockResolvedValue({
          rawRequest$: new Subject<string>(),
          stop
        })
      }
    });

    const result = await performTest({ requestCaptureTimeoutMs: 10 });

    expect(result.eventRequest).toBe('');
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('returns an empty request when the interception handle completes without a request', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    const { interceptor, performTest } = createServiceHarness({
      interceptor: {
        setupInterception: vi.fn().mockResolvedValue({
          rawRequest$: EMPTY,
          stop
        }),
        getRawRequest: vi.fn(() => of('legacy-stale-request')),
        clearRawRequest: vi.fn()
      }
    });

    const result = await performTest({ requestCaptureTimeoutMs: 10 });

    expect(result.eventRequest).toBe('');
    expect(interceptor.getRawRequest).not.toHaveBeenCalled();
    expect(interceptor.clearRawRequest).not.toHaveBeenCalled();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('requires an interception handle instead of falling back to legacy raw request state', async () => {
    const { interceptor, performTest } = createServiceHarness({
      interceptor: {
        setupInterception: vi.fn().mockResolvedValue(null),
        getRawRequest: vi.fn(() => of('legacy-stale-request')),
        clearRawRequest: vi.fn()
      }
    });

    await expect(performTest({ requestCaptureTimeoutMs: 10 })).rejects.toThrow(
      /Request interception handle is required/
    );
    expect(interceptor.getRawRequest).not.toHaveBeenCalled();
    expect(interceptor.clearRawRequest).not.toHaveBeenCalled();
  });
});
