import { Injectable } from '@nestjs/common';
import { USER_AGENT } from 'apps/nest-datalayer-checker/src/configs/puppeteer.config';
import { Page } from 'puppeteer';

@Injectable()
export class RequestService {
  private requests: string[] = [];
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
}
