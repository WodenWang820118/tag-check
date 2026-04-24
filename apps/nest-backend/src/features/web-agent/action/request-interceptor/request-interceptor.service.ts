import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { Ga4RequestMatcher } from './ga4-request-matcher.service';
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

interface CdpRequestWillBeSentEvent {
  request: {
    url: string;
    postData?: string;
  };
}

@Injectable()
export class RequestInterceptorService {
  private readonly logger = new Logger(RequestInterceptorService.name);
  private readonly rawRequest = new BehaviorSubject<string>('');

  constructor(
    private readonly dataLayerService: DataLayerService,
    private readonly ga4RequestMatcher: Ga4RequestMatcher
  ) {}

  async setupInterception(
    page: Page,
    projectSlug: string,
    eventId: string,
    eventName: string,
    measurementId: string
  ): Promise<RequestInterceptionHandle> {
    await page.setCacheEnabled(false);
    await page.setBypassServiceWorker(true);

    const cdp = await page.createCDPSession();
    const rawRequest$ = new ReplaySubject<string>(1);
    let stopped = false;

    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.setBypassServiceWorker', { bypass: true });

    const requestHandler = async (event: CdpRequestWillBeSentEvent) => {
      const requestUrl = event.request.url;
      const postData =
        (event.request &&
          (event.request as unknown as { postData?: string }).postData) ||
        '';

      if (
        this.ga4RequestMatcher.isMatchingGa4Request(
          requestUrl,
          postData,
          eventName,
          measurementId
        )
      ) {
        this.logger.log(`Request captured using CDP: ${requestUrl}`);
        rawRequest$.next(requestUrl);
        await cdp.send('Network.disable');
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
      } else {
        this.logger.debug(`CDP Request (non-matching): ${requestUrl}`);
      }
    };

    cdp.on('Network.requestWillBeSent', requestHandler);

    return {
      rawRequest$,
      stop: async () => {
        if (stopped) return;
        stopped = true;
        const off =
          (cdp as unknown as { off?: (event: string, cb: unknown) => void })
            .off ??
          (
            cdp as unknown as {
              removeListener?: (event: string, cb: unknown) => void;
            }
          ).removeListener;
        off?.call(cdp, 'Network.requestWillBeSent', requestHandler);
        await cdp
          .send('Network.disable')
          .catch((error) =>
            this.logger.warn(`Failed to disable CDP network: ${error}`)
          );
        await (cdp as unknown as { detach?: () => Promise<void> })
          .detach?.()
          .catch((error) =>
            this.logger.warn(`Failed to detach CDP session: ${error}`)
          );
        rawRequest$.complete();
      }
    };
  }

  // Matching logic moved to Ga4RequestMatcher (SRP)

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
