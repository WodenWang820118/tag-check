import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import {
  BehaviorSubject,
  catchError,
  first,
  of,
  timeout,
  TimeoutError
} from 'rxjs';

@Injectable()
export class RequestInterceptorService {
  private readonly logger = new Logger(RequestInterceptorService.name);
  private readonly rawRequest = new BehaviorSubject<string>('');

  constructor(private readonly dataLayerService: DataLayerService) {}

  async setupInterception(
    page: Page,
    projectSlug: string,
    eventId: string,
    eventName: string,
    measurementId: string
  ) {
    await page.setCacheEnabled(false);
    await page.setBypassServiceWorker(true);

    const cdp = await page.createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.setBypassServiceWorker', { bypass: true });

    cdp.on('Network.requestWillBeSent', async (event) => {
      const requestUrl = event.request.url;
      const postData =
        (event.request &&
          (event.request as unknown as { postData?: string }).postData) ||
        '';

      if (
        this.isMatchingGa4Request(
          requestUrl,
          postData,
          eventName,
          measurementId
        )
      ) {
        this.logger.log(`Request captured using CDP: ${requestUrl}`);
        this.setRawRequest(requestUrl);
        await cdp.send('Network.disable');
        try {
          const latestDataLayer = await page.evaluate(
            () => (window as any).dataLayer
          );
          await this.dataLayerService.updateSelfDataLayerAlgorithm(
            latestDataLayer as any[],
            projectSlug,
            eventId
          );
        } catch (error) {
          this.logger.error(`Error updating data layer: ${error}`);
        }
      } else {
        this.logger.debug(`CDP Request (non-matching): ${requestUrl}`);
      }
    });
  }

  private isMatchingGa4Request(
    url: string,
    postData: string,
    eventName: string,
    measurementId: string
  ): boolean {
    try {
      // Parse URL safely
      const parsed = new URL(url);

      if (
        !parsed.hostname.includes('google-analytics.com') ||
        !parsed.pathname.includes('/g/collect')
      ) {
        // Not a GA4 collect endpoint
        return false;
      }

      const urlParams = parsed.searchParams;
      const enParam = urlParams.get('en');
      // check multiple possible measurement id param names
      const tidParam =
        urlParams.get('tid') ||
        urlParams.get('measurement_id') ||
        urlParams.get('mid');

      if (enParam === eventName && tidParam === measurementId) return true;

      // If request used POST, the payload may contain the params
      if (postData) {
        try {
          // If body looks like JSON (Measurement Protocol v2 / mp/collect), try parsing
          if (postData.trim().startsWith('{')) {
            const bodyJson = JSON.parse(postData);
            // event name often appears under events[0].name for MP v2
            const bodyEventName =
              (Array.isArray(bodyJson.events) && bodyJson.events[0]?.name) ||
              '';
            const bodyMeasurementId =
              bodyJson.measurement_id || urlParams.get('measurement_id') || '';
            if (
              bodyEventName === eventName &&
              bodyMeasurementId === measurementId
            )
              return true;
          } else {
            // Otherwise try parsing as URLSearchParams encoded body
            const bodyParams = new URLSearchParams(postData);
            const bodyEn = bodyParams.get('en');
            const bodyTid =
              bodyParams.get('tid') ||
              bodyParams.get('measurement_id') ||
              bodyParams.get('mid');
            if (bodyEn === eventName && bodyTid === measurementId) return true;
          }
        } catch {
          // ignore JSON / parsing errors and continue
        }
      }
    } catch (err) {
      // If URL parsing fails, log at debug level and don't crash.
      this.logger.debug(`Failed to parse request URL for GA4 matching: ${err}`);
      return false;
    }

    return false;
  }

  setRawRequest(request: string) {
    this.rawRequest.next(request);
  }

  getRawRequest() {
    return this.rawRequest.pipe(
      timeout(15000),
      first((request) => !!request),
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

  clearRawRequest() {
    this.rawRequest.next('');
  }
}
