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
  TimeoutError,
} from 'rxjs';

@Injectable()
export class RequestInterceptorService {
  private rawRequest = new BehaviorSubject<string>('');

  constructor(private dataLayerService: DataLayerService) {}

  async setupInterception(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string
  ) {
    const eventName = extractEventNameFromId(eventId);
    await page.setRequestInterception(true);
    await page.setCacheEnabled(false);

    page.on('request', async (request) => {
      if (request.isInterceptResolutionHandled()) return;

      const requestUrl = request.url();

      if (this.isMatchingGa4Request(requestUrl, eventName, measurementId)) {
        Logger.log(
          `Request captured: ${requestUrl}`,
          `${RequestInterceptorService.name}.${RequestInterceptorService.prototype.setupInterception.name}`
        );
        this.setRawRequest(requestUrl);

        try {
          const latestDataLayer = await page.evaluate(() => window.dataLayer);
          await this.dataLayerService.updateSelfDataLayerAlgorithm(
            latestDataLayer,
            projectSlug,
            eventId
          );
        } catch (error) {
          Logger.error(`Error updating data layer: ${error}`);
        }

        await request.abort();
      } else {
        Logger.warn(`Request: ${requestUrl}`);
        await request.continue();
      }
    });

    // Add response interception for more information
    page.on('response', async (response) => {
      const url = response.url();
      const context = `${RequestInterceptorService.name}.${RequestInterceptorService.prototype.setupInterception.name}`;
      if (this.isMatchingGa4Request(url, eventName, measurementId)) {
        Logger.log(`Intercepted GA4 response: ${url}`, context);
        Logger.log(`Response status: ${response.status()}`, context);
        Logger.log(
          `Response headers: ${JSON.stringify(response.headers())}`,
          context
        );
        try {
          const responseBody = await response.text();
          Logger.log(`Response body: ${responseBody}`, context);
        } catch (error) {
          Logger.error(`Error reading response body: ${error}`, context);
        }
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
      timeout(10000),
      first((request) => !!request),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          Logger.warn('Timeout occurred while waiting for raw request');
          return of('');
        }
        Logger.error(`Error getting raw request: ${error}`);
        return of('');
      })
    );
  }
}
