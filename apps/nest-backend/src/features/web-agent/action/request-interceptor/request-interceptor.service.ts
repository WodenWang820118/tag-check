/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { extractEventNameFromId } from '@utils';
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
    measurementId: string
  ) {
    const eventName = extractEventNameFromId(eventId);
    await page.setCacheEnabled(false);
    await page.setBypassServiceWorker(true);

    const cdp = await page.createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.setBypassServiceWorker', { bypass: true });

    cdp.on('Network.requestWillBeSent', async (event) => {
      const requestUrl = event.request.url;
      if (this.isMatchingGa4Request(requestUrl, eventName, measurementId)) {
        this.logger.log(`Request captured using CDP: ${requestUrl}`);
        this.setRawRequest(requestUrl);
        await cdp.send('Network.disable');
        try {
          const latestDataLayer = await page.evaluate(() => window.dataLayer);
          await this.dataLayerService.updateSelfDataLayerAlgorithm(
            latestDataLayer,
            projectSlug,
            eventId
          );
        } catch (error) {
          this.logger.error(`Error updating data layer: ${error}`);
        }
      } else {
        this.logger.warn(`CDP Request: ${requestUrl}`);
      }
    });
  }

  private isMatchingGa4Request(
    url: string,
    eventName: string,
    measurementId: string
  ): boolean {
    const decodedUrl = decodeURIComponent(url);

    if (!decodedUrl.includes('google-analytics.com/g/collect')) {
      return false;
    }

    const urlParams = new URLSearchParams(new URL(decodedUrl).search);
    const matchesEventName = urlParams.get('en') === eventName;
    const matchesMeasurementId = urlParams.get('tid') === measurementId;

    return matchesEventName && matchesMeasurementId;
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
