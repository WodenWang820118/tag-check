/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { extractEventNameFromId } from '@utils';
import {
  BehaviorSubject,
  catchError,
  map,
  of,
  race,
  take,
  timeout,
  timer,
} from 'rxjs';

@Injectable()
export class RequestInterceptorService {
  constructor(private dataLayerService: DataLayerService) {}
  private rawRequest = new BehaviorSubject<string>('');

  async setupInterception(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string
  ) {
    const eventName = extractEventNameFromId(eventId);
    // Logic for setting request interception and handling requests
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      const requestUrl = request.url();
      Logger.warn(
        `Request: ${requestUrl}`,
        `${RequestInterceptorService.name}.${RequestInterceptorService.prototype.setupInterception.name}`
      );
      if (this.isMatchingGa4Request(requestUrl, eventName, measurementId)) {
        Logger.log(
          `Request captured: ${request.url()}`,
          'RequestInterceptorService.setupInterception'
        );
        Logger.log(
          request.url(),
          `${RequestInterceptorService.name}.${RequestInterceptorService.prototype.setupInterception.name}`
        );
        this.setRawRequest(request.url());
        const latestDataLayer = await page.evaluate(() => {
          return window.dataLayer;
        });
        await this.dataLayerService.updateSelfDataLayerAlgorithm(
          latestDataLayer,
          projectSlug,
          eventId
        );
        await request.abort();
      } else {
        await request.continue();
      }
    });
  }

  private isMatchingGa4Request(
    url: string,
    eventName: string,
    measurementId: string
  ): boolean {
    const decodedUrl = decodeURIComponent(url);

    // Check if it's a GA4 collect request
    if (!decodedUrl.includes('google-analytics.com/g/collect')) {
      return false;
    }

    // Parse URL parameters
    const urlParams = new URLSearchParams(new URL(decodedUrl).search);

    // Check for matching event name
    const matchesEventName = urlParams.get('en') === eventName;

    // Check for matching measurement ID
    const matchesMeasurementId = urlParams.get('tid') === measurementId;

    return matchesEventName && matchesMeasurementId;
  }

  setRawRequest(request: string) {
    this.rawRequest.next(request);
  }

  getRawRequest() {
    return race(
      this.rawRequest.pipe(
        take(1),
        timeout(10000) // 10 seconds timeout
      ),
      timer(10000).pipe(map(() => '')) // Emit empty string after 10 seconds
    ).pipe(
      catchError(() => of('')) // Handle timeout error by returning empty string
    );
  }
}
