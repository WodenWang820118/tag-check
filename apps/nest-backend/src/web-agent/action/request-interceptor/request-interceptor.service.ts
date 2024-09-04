/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { extractEventNameFromId } from '@utils';

@Injectable()
export class RequestInterceptorService {
  constructor(private dataLayerService: DataLayerService) {}

  async setupInterception(page: Page, projectName: string, eventId: string) {
    // Logic for setting request interception and handling requests
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      if (
        request.url().includes('eeListClick') ||
        request.url().includes('select_promotion') ||
        request.url().includes('eePromoClick') ||
        request.url().includes('select_item') ||
        request.url().includes('select_promotion')
      ) {
        // small delay will cause the dataLayer to be different
        // it's unknown why, but instead of using webMonitoringService.updateSelfDataLayer
        // we use updateSelfDataLayerAlgorithm to update the dataLayer manually
        Logger.log(
          request.url(),
          `${RequestInterceptorService.name}.${RequestInterceptorService.prototype.setupInterception.name}`
        );
        const latestDataLayer = await page.evaluate(() => {
          return window.dataLayer;
        });
        await this.dataLayerService.updateSelfDataLayerAlgorithm(
          latestDataLayer,
          projectName,
          extractEventNameFromId(eventId)
        );
        await request.continue();
      } else {
        await request.continue();
      }
    });
  }
}
