/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable } from '@nestjs/common';
import { ConfigsService } from '../../../../../core/configs/configs.service';
import { Page } from 'puppeteer';

@Injectable()
export class RequestService {
  private requests: string[] = [];

  constructor(private configsService: ConfigsService) {}

  async initializeRequestCapture(page: Page): Promise<void> {
    this.requests = []; // Reset the request list

    await page.setRequestInterception(true);
    await page.setUserAgent(this.configsService.getUSER_AGENT());

    const requestHandler = async (request: {
      isInterceptResolutionHandled: () => any;
      url: () => string;
      continue: () => any;
    }) => {
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
