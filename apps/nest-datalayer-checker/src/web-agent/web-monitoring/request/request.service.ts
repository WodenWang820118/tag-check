import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../data-layer/data-layer.service';
import { Operation } from 'apps/nest-datalayer-checker/src/shared/interfaces/recording.interface';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';

@Injectable()
export class RequestService {
  private requests: string[] = [];

  constructor(private dataLayerService: DataLayerService) {}

  async initializeRequestCapture(page: Page): Promise<void> {
    this.requests = []; // Reset the request list

    await page.setRequestInterception(true);
    await page.setUserAgent(USER_AGENT);

    const requestHandler = async (request) => {
      if (request.isInterceptResolutionHandled()) return;
      this.requests.push(request.url());
      await request.continue();
    };

    page.on('request', requestHandler);
  }

  async stopRequestCapture(page: Page): Promise<string[]> {
    page.removeAllListeners('request');
    await page.setRequestInterception(false);
    return this.requests;
  }

  async interceptRequest(
    page: Page,
    projectName: string,
    operation: Operation
  ) {
    // Logic for setting request interception and handling requests
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      if (
        request.url().includes('eeListClick') ||
        request.url().includes('select_promotion') ||
        request.url().includes('eePromoClick')
      ) {
        // small delay will cause the dataLayer to be different
        // it's unknown why, but instead of using webMonitoringService.updateSelfDataLayer
        // we use updateSelfDataLayerAlgorithm to update the dataLayer manually
        const latestDataLayer = await page.evaluate(() => {
          return window.dataLayer;
        });
        this.dataLayerService.updateSelfDataLayerAlgorithm(
          latestDataLayer,
          projectName,
          operation.title
        );
      }
      await request.continue();
    });
  }
}
