import { Injectable, Logger } from '@nestjs/common';
import type { Page, Protocol } from 'puppeteer';
import { getGa4EventNameIssues } from '@utils';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { Ga4RequestMatcher } from './ga4-request-matcher.service';
import {
  GA4_COLLECT_URL_PATTERN,
  Ga4CollectEvent,
  parseGa4CollectRequest
} from './ga4-collect-request';
import {
  BehaviorSubject,
  catchError,
  first,
  of,
  ReplaySubject,
  timeout,
  TimeoutError
} from 'rxjs';

export interface RequestInterceptionHandle {
  rawRequest$: ReplaySubject<string>;
  stop(): Promise<void>;
}

type CollectRequestListener = (url: string, postData: string) => void;

interface RequestTap {
  stop(): Promise<void>;
}

/** Large enough for gtag.js batches, which carry one event per body line. */
const MAX_POST_DATA_BYTES = 1024 * 1024;

@Injectable()
export class RequestInterceptorService {
  private readonly logger = new Logger(RequestInterceptorService.name);
  private readonly rawRequest = new BehaviorSubject<string>('');

  constructor(
    private readonly dataLayerService: DataLayerService,
    private readonly ga4RequestMatcher: Ga4RequestMatcher
  ) {}

  /**
   * Watches the page's GA4 collect requests and emits the first event
   * matching `eventName` and `measurementId`.
   *
   * The emitted value is a single URL with the request-level parameters and
   * the matched event's parameters, so events that gtag.js batched or moved
   * into the POST body come out the same way as single-event requests.
   */
  async setupInterception(
    page: Page,
    projectSlug: string,
    eventId: string,
    eventName: string,
    measurementId: string
  ): Promise<RequestInterceptionHandle> {
    await page.setCacheEnabled(false);
    await page.setBypassServiceWorker(true);
    this.warnAboutInvalidEventName(eventName);

    const rawRequest$ = new ReplaySubject<string>(1);
    const observedEvents: Ga4CollectEvent[] = [];
    let captured = false;
    let stopped = false;

    const onCollectRequest: CollectRequestListener = (url, postData) => {
      const events = parseGa4CollectRequest(url, postData);
      observedEvents.push(...events);
      if (captured || stopped) return;

      const match = this.ga4RequestMatcher.findMatchingEvent(
        events,
        eventName,
        measurementId
      );
      if (!match) {
        this.logger.debug(`GA4 request (non-matching): ${url}`);
        return;
      }

      captured = true;
      this.logger.log(
        `GA4 request captured: ${match.eventName} (${match.measurementId}) via ${match.endpoint}, event ${match.batchIndex + 1} of ${match.batchSize}`
      );
      rawRequest$.next(match.normalizedUrl);
      void this.snapshotDataLayer(page, projectSlug, eventId);
    };

    const tap =
      (await this.tapFetchRequests(page, onCollectRequest)) ??
      (await this.tapNetworkRequests(page, onCollectRequest));

    return {
      rawRequest$,
      stop: async () => {
        if (stopped) return;
        stopped = true;
        await tap.stop();
        if (!captured) {
          this.logger.warn(
            describeMissedCapture(eventName, measurementId, observedEvents)
          );
        }
        rawRequest$.complete();
      }
    };
  }

  /**
   * Intercepts collect requests with the page's Fetch domain. Unlike the
   * Network domain it also sees the keepalive request gtag.js sends on
   * `pagehide` when a click navigates away. It must be the page's own session:
   * a browser-level Fetch session misses requests from documents that loaded
   * before it was enabled. Returns null when Fetch cannot be enabled.
   */
  private async tapFetchRequests(
    page: Page,
    onCollectRequest: CollectRequestListener
  ): Promise<RequestTap | null> {
    const session = await page.createCDPSession();
    const onRequestPaused = (event: Protocol.Fetch.RequestPausedEvent) => {
      // Release the request before reading it so capture never delays the site.
      session
        .send('Fetch.continueRequest', { requestId: event.requestId })
        .catch((error) =>
          this.logger.debug(`Failed to continue paused request: ${error}`)
        );
      onCollectRequest(event.request.url, readPostData(event.request));
    };

    session.on('Fetch.requestPaused', onRequestPaused);
    try {
      await session.send('Fetch.enable', {
        patterns: [
          { urlPattern: GA4_COLLECT_URL_PATTERN, requestStage: 'Request' }
        ]
      });
    } catch (error) {
      session.off('Fetch.requestPaused', onRequestPaused);
      await session.detach().catch(() => undefined);
      this.logger.warn(`Fetch-based request capture unavailable: ${error}`);
      return null;
    }

    return {
      stop: async () => {
        session.off('Fetch.requestPaused', onRequestPaused);
        await session
          .send('Fetch.disable')
          .catch((error) =>
            this.logger.warn(`Failed to disable CDP fetch: ${error}`)
          );
        await session
          .detach()
          .catch((error) =>
            this.logger.warn(`Failed to detach CDP session: ${error}`)
          );
      }
    };
  }

  /**
   * Fallback that observes the page's Network domain. It misses requests sent
   * while the page unloads.
   */
  private async tapNetworkRequests(
    page: Page,
    onCollectRequest: CollectRequestListener
  ): Promise<RequestTap> {
    const session = await page.createCDPSession();
    const onRequestWillBeSent = async (
      event: Protocol.Network.RequestWillBeSentEvent
    ) => {
      let postData = readPostData(event.request);
      if (!postData && event.request.hasPostData) {
        postData = await session
          .send('Network.getRequestPostData', { requestId: event.requestId })
          .then((response) => response.postData)
          .catch(() => '');
      }
      onCollectRequest(event.request.url, postData);
    };

    session.on('Network.requestWillBeSent', onRequestWillBeSent);
    await session.send('Network.enable', {
      maxPostDataSize: MAX_POST_DATA_BYTES
    });
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.setBypassServiceWorker', { bypass: true });

    return {
      stop: async () => {
        session.off('Network.requestWillBeSent', onRequestWillBeSent);
        await session
          .send('Network.disable')
          .catch((error) =>
            this.logger.warn(`Failed to disable CDP network: ${error}`)
          );
        await session
          .detach()
          .catch((error) =>
            this.logger.warn(`Failed to detach CDP session: ${error}`)
          );
      }
    };
  }

  private async snapshotDataLayer(
    page: Page,
    projectSlug: string,
    eventId: string
  ): Promise<void> {
    try {
      const latestDataLayer = await page.evaluate(
        () => (globalThis as unknown as { dataLayer?: unknown[] }).dataLayer
      );
      await this.dataLayerService.updateSelfDataLayerAlgorithm(
        latestDataLayer ?? [],
        projectSlug,
        eventId
      );
    } catch (error) {
      this.logger.error(`Error updating data layer: ${error}`);
    }
  }

  private warnAboutInvalidEventName(eventName: string): void {
    const issues = getGa4EventNameIssues(eventName.trim());
    if (issues.length > 0) {
      this.logger.warn(
        `"${eventName}" can never match a GA4 request: event names ${issues.join(' and ')} (https://support.google.com/analytics/answer/13316687)`
      );
    }
  }

  setRawRequest(request: string) {
    this.rawRequest.next(request);
  }

  /**
   * Returns an observable of the raw GA4 request URL captured by the interceptor.
   * By default it waits (up to 15s) for a non-empty value (useful in production flows).
   * Tests can pass a shorter timeout and/or disable the non-empty wait so they do not
   * block for the full default timeout when asserting timeout behaviour or after a clear.
   *
   * @deprecated Use the handle returned by setupInterception instead.
   */
  getRawRequest(options?: { timeoutMs?: number; waitForNonEmpty?: boolean }) {
    const { timeoutMs = 15000, waitForNonEmpty = true } = options || {};
    return this.rawRequest.pipe(
      timeout(timeoutMs),
      // Only gate on non-empty if requested (mirrors previous semantics by default)
      waitForNonEmpty ? first((request) => !!request) : first(),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          this.logger.warn('Timeout occurred while waiting for raw request');
          return of('');
        }
        this.logger.error(`Error getting raw request: ${error}`);
        return of('');
      })
    );
  }

  /** @deprecated Use the handle returned by setupInterception instead. */
  clearRawRequest() {
    this.rawRequest.next('');
  }
}

function readPostData(request: {
  postData?: string;
  postDataEntries?: Protocol.Network.PostDataEntry[];
}): string {
  if (request.postData !== undefined) {
    return request.postData;
  }
  return (request.postDataEntries ?? [])
    .map((entry) =>
      entry.bytes ? Buffer.from(entry.bytes, 'base64').toString('utf8') : ''
    )
    .join('');
}

function describeMissedCapture(
  eventName: string,
  measurementId: string,
  observedEvents: readonly Ga4CollectEvent[]
): string {
  const expected = `en=${eventName} tid=${measurementId || '(any)'}`;
  if (observedEvents.length === 0) {
    return `No GA4 request matched ${expected}; no GA4 requests were seen while capturing.`;
  }
  const seen = observedEvents
    .map((event) => `${event.eventName} → ${event.measurementId}`)
    .join(', ');
  return `No GA4 request matched ${expected}. GA4 events seen while capturing: ${seen}`;
}
