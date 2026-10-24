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
import { ReplaySubject } from 'rxjs';

/**
 * One run's GA4 request capture. `rawRequest$` replays the matched request
 * to late subscribers and completes on stop(). The caller must call stop(),
 * which releases the CDP session and is safe to call twice.
 */
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

/**
 * Captures the GA4 collect request a test expects while its recording
 * replays, and snapshots the dataLayer at the moment it is sent.
 */
@Injectable()
export class RequestInterceptorService {
  private readonly logger = new Logger(RequestInterceptorService.name);

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
    try {
      // In order: the other two Network commands need the domain enabled.
      await session.send('Network.enable', {
        maxPostDataSize: MAX_POST_DATA_BYTES
      });
      await session.send('Network.setCacheDisabled', { cacheDisabled: true });
      await session.send('Network.setBypassServiceWorker', { bypass: true });
    } catch (error) {
      // The caller gets no handle to stop, so the session is released here.
      session.off('Network.requestWillBeSent', onRequestWillBeSent);
      await session.detach().catch(() => undefined);
      throw error;
    }

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

  /**
   * Merges the page's dataLayer as it is when the matched request is sent,
   * before a navigation can replace it. Never throws.
   */
  private async snapshotDataLayer(
    page: Page,
    projectSlug: string,
    eventId: string
  ): Promise<void> {
    try {
      // Helper-free on purpose: swc compiles this function to ES5 for the
      // page, which has none of the bundle's helpers (see AGENTS.md).
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
}

/**
 * The request body as text. CDP sends it as `postData`, or only as base64
 * `postDataEntries` when the body is large or binary.
 */
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

/** The warning logged when the run ends without a matching request. */
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
