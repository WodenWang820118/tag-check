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
  private readonly logger = new Logger(RequestInterceptorService.name);
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
        this.logger.log(`Request captured: ${requestUrl}`);
        this.setRawRequest(requestUrl);

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

        await request.abort();
      } else {
        this.logger.warn(`Request: ${requestUrl}`);
        await request.continue();
      }
    });

    // Add response interception for more information
    page.on('response', async (response) => {
      const url = response.url();
      if (this.isMatchingGa4Request(url, eventName, measurementId)) {
        this.logger.log(`Intercepted GA4 response: ${url}`);
        this.logger.log(`Response status: ${response.status()}`);
        this.logger.log(
          `Response headers: ${JSON.stringify(response.headers())}`
        );
        try {
          const responseBody = await response.text();
          this.logger.log(`Response body: ${responseBody}`);
        } catch (error) {
          this.logger.error(`Error reading response body: ${error}`);
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
          this.logger.warn('Timeout occurred while waiting for raw request');
          return of('');
        }
        this.logger.error(`Error getting raw request: ${error}`);
        return of('');
      })
    );
  }
}
