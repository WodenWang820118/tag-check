import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';

export class RequestInterceptor {
  constructor(private dataLayerService: DataLayerService) {}

  async interceptRequest(page: Page, projectName: string, operation: any) {
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
