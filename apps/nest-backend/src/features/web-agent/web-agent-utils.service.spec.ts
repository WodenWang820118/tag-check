import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { DataLayerService } from './action/web-monitoring/data-layer/data-layer.service';
import { ActionService } from './action/action.service';
import { RequestInterceptorService } from './action/request-interceptor/request-interceptor.service';
import { Subject, of } from 'rxjs';

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

describe('WebAgentUtilsService.getOptimizedDataLayer', () => {
  let service: WebAgentUtilsService;
  let mockDataLayerService: Partial<DataLayerService>;
  let getMyDataLayerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMyDataLayerMock = vi.fn();
    mockDataLayerService = {
      getMyDataLayer: getMyDataLayerMock
    };

    // Create service with only the DataLayerService mocked, other dependencies stubbed
    const mockAction = {} as unknown as ActionService;
    const mockInterceptor = {} as unknown as RequestInterceptorService;
    service = new WebAgentUtilsService(
      mockAction,
      mockDataLayerService as DataLayerService,
      mockInterceptor,
      {} as any
    );
  });

  it('should remove gtm.uniqueEventId from each data layer event', async () => {
    // Arrange
    getMyDataLayerMock.mockResolvedValue(sampleDataLayer);
    // Create expected by removing gtm.uniqueEventId key from each event
    const expected = sampleDataLayer.map((obj) => {
      const copy = { ...obj } as Record<string, unknown>;
      delete copy['gtm.uniqueEventId'];
      return copy;
    });

    // Act
    // Access private method via testable interface
    interface TestableService {
      getOptimizedDataLayer(
        projectSlug: string,
        eventId: string
      ): Promise<Record<string, unknown>[]>;
    }
    const testable = service as unknown as TestableService;
    const result = await testable.getOptimizedDataLayer(
      'example-project',
      'event-id'
    );

    // Assert
    expect(result).toEqual(expected);
    // Ensure the underlying service was called correctly
    expect(getMyDataLayerMock).toHaveBeenCalledWith(
      'example-project',
      'event-id'
    );
  });
});

describe('WebAgentUtilsService.performTest request capture', () => {
  it('uses the per-interception handle instead of the legacy rawRequest subject', async () => {
    const rawRequest =
      'https://www.google-analytics.com/g/collect?v=2&en=purchase&tid=G-TEST';
    const stop = vi.fn().mockResolvedValue(undefined);
    const mockAction = {
      performOperation: vi.fn().mockResolvedValue(undefined)
    } as unknown as ActionService;
    const mockDataLayerService = {
      initSelfDataLayer: vi.fn().mockResolvedValue(undefined),
      updateSelfDataLayer: vi.fn().mockResolvedValue(undefined),
      getMyDataLayer: vi.fn().mockResolvedValue([])
    } as unknown as DataLayerService;
    const mockInterceptor = {
      setupInterception: vi.fn().mockResolvedValue({
        rawRequest$: of(rawRequest),
        stop
      }),
      getRawRequest: vi.fn(),
      clearRawRequest: vi.fn()
    } as unknown as RequestInterceptorService;
    const mockTestEventRepository = {
      getEntityByEventId: vi.fn().mockResolvedValue({ eventName: 'purchase' })
    };
    const service = new WebAgentUtilsService(
      mockAction,
      mockDataLayerService,
      mockInterceptor,
      mockTestEventRepository as any
    );
    const page = {
      authenticate: vi.fn().mockResolvedValue(undefined),
      waitForNavigation: vi.fn().mockRejectedValue(new Error('no navigation')),
      url: vi.fn(() => 'https://example.test/thank-you')
    };

    const result = await service.performTest(
      page as any,
      'project',
      'event-id',
      'G-TEST',
      { username: '', password: '' },
      true,
      { localStorage: { data: [] }, cookie: { data: [] } } as any
    );

    expect(mockInterceptor.setupInterception).toHaveBeenCalledTimes(1);
    expect(mockInterceptor.getRawRequest).not.toHaveBeenCalled();
    expect(mockInterceptor.clearRawRequest).not.toHaveBeenCalled();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(result.eventRequest).toBe(rawRequest);
  });

  it('does not set up request interception when captureRequest is false', async () => {
    const mockAction = {
      performOperation: vi.fn().mockResolvedValue(undefined)
    } as unknown as ActionService;
    const mockDataLayerService = {
      initSelfDataLayer: vi.fn().mockResolvedValue(undefined),
      updateSelfDataLayer: vi.fn().mockResolvedValue(undefined),
      getMyDataLayer: vi.fn().mockResolvedValue([])
    } as unknown as DataLayerService;
    const mockInterceptor = {
      setupInterception: vi.fn()
    } as unknown as RequestInterceptorService;
    const mockTestEventRepository = {
      getEntityByEventId: vi.fn().mockResolvedValue({ eventName: 'purchase' })
    };
    const service = new WebAgentUtilsService(
      mockAction,
      mockDataLayerService,
      mockInterceptor,
      mockTestEventRepository as any
    );
    const page = {
      authenticate: vi.fn().mockResolvedValue(undefined),
      waitForNavigation: vi.fn().mockRejectedValue(new Error('no navigation')),
      url: vi.fn(() => 'https://example.test/thank-you')
    };

    await service.performTest(
      page as any,
      'project',
      'event-id',
      'G-TEST',
      { username: '', password: '' },
      false,
      { localStorage: { data: [] }, cookie: { data: [] } } as any
    );

    expect(mockInterceptor.setupInterception).not.toHaveBeenCalled();
  });

  it('stops request interception when the action fails', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    const mockAction = {
      performOperation: vi.fn().mockRejectedValue(new Error('action failed'))
    } as unknown as ActionService;
    const mockDataLayerService = {
      initSelfDataLayer: vi.fn().mockResolvedValue(undefined)
    } as unknown as DataLayerService;
    const mockInterceptor = {
      setupInterception: vi.fn().mockResolvedValue({
        rawRequest$: of(''),
        stop
      })
    } as unknown as RequestInterceptorService;
    const mockTestEventRepository = {
      getEntityByEventId: vi.fn().mockResolvedValue({ eventName: 'purchase' })
    };
    const service = new WebAgentUtilsService(
      mockAction,
      mockDataLayerService,
      mockInterceptor,
      mockTestEventRepository as any
    );

    await expect(
      service.performTest(
        { authenticate: vi.fn().mockResolvedValue(undefined) } as any,
        'project',
        'event-id',
        'G-TEST',
        { username: '', password: '' },
        true,
        { localStorage: { data: [] }, cookie: { data: [] } } as any
      )
    ).rejects.toThrow(/action failed/);

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('times out and stops request interception when no matching request is captured', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    const mockAction = {
      performOperation: vi.fn().mockResolvedValue(undefined)
    } as unknown as ActionService;
    const mockDataLayerService = {
      initSelfDataLayer: vi.fn().mockResolvedValue(undefined),
      updateSelfDataLayer: vi.fn().mockResolvedValue(undefined),
      getMyDataLayer: vi.fn().mockResolvedValue([])
    } as unknown as DataLayerService;
    const mockInterceptor = {
      setupInterception: vi.fn().mockResolvedValue({
        rawRequest$: new Subject<string>(),
        stop
      })
    } as unknown as RequestInterceptorService;
    const mockTestEventRepository = {
      getEntityByEventId: vi.fn().mockResolvedValue({ eventName: 'purchase' })
    };
    const service = new WebAgentUtilsService(
      mockAction,
      mockDataLayerService,
      mockInterceptor,
      mockTestEventRepository as any
    );
    const page = {
      authenticate: vi.fn().mockResolvedValue(undefined),
      waitForNavigation: vi.fn().mockRejectedValue(new Error('no navigation')),
      url: vi.fn(() => 'https://example.test/thank-you')
    };

    const result = await service.performTest(
      page as any,
      'project',
      'event-id',
      'G-TEST',
      { username: '', password: '' },
      true,
      { localStorage: { data: [] }, cookie: { data: [] } } as any,
      { requestCaptureTimeoutMs: 10 }
    );

    expect(result.eventRequest).toBe('');
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
