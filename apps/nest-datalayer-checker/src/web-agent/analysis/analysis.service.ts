import { Injectable } from '@nestjs/common';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { Page } from 'puppeteer';
import { USER_AGENT } from '../../configs/puppeteer.config';

@Injectable()
export class AnalysisService {
  constructor(private puppeteerService: PuppeteerService) {}

  /**
   * Retrieves the data layer from a page
   * @param page The page to retrieve the data layer from
   * @param seconds Optional time in milliseconds to wait before retrieving the data layer
   * @returns A Promise resolving to an array of data layer objects
   */
  async getDataLayer(page: Page, seconds: number = 1000) {
    try {
      await page.waitForFunction(() => typeof window.dataLayer !== 'undefined');
      await new Promise(resolve => setTimeout(resolve, seconds));
      return await page.evaluate(() => {
        // TODO: sometmies cannot retreive dataLayer
        return window.dataLayer;
      });
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  /**
   * Retrieves the Google Click ID (GCLID) values from an array of request URLs
   * @param requests The array of request URLs to retrieve GCLIDs from
   * @returns An array of GCLID values
   */
  getGcs(requests: string[]) {
    if (!requests) return [];
    return requests.map(request => request.split('gcs=')[1].split('&')[0]);
  }

  /**
   * Retrieves the Google Tag Manager IDs installed on a page
   * @param page The page to retrieve the IDs from
   * @param url The URL of the page
   * @returns A Promise resolving to an array of GTM
   */
  async getInstalledGtms(page: Page, url: string) {
    const requests = await this.getAllRequests(page, url);
    const gtmRequests = requests.filter(request =>
      request.includes('collect?v=2'),
    );
    if (gtmRequests.length > 0) {
      const installedGtms = gtmRequests.map(
        request => request.split('tid=')[1].split('&')[0],
      );
      return installedGtms;
    }
    return [];
  }

  /**
   * Detects Google Tag Manager installations on a page
   * @param url The URL of the page to detect installations on
   * @returns A Promise resolving to an array of GTM IDs
   */
  async detectGtm(url: string) {
    const browser = await this.puppeteerService.initAndReturnBrowser();

    try {
      const page = await this.puppeteerService.nativateTo(url, browser);
      const result = await this.getInstalledGtms(page, url);
      // console.dir('result', result);
      return result;
    } finally {
      await browser.close();
    }
  }

  /**
   * Retrieves all network requests made by a page
   * @param page The page to retrieve requests from
   * @param url The URL of the page
   * @returns A Promise resolving to an array of request URLs
   */
  async getAllRequests(page: Page, url: string): Promise<string[]> {
    const requests: string[] = [];
    await page.setRequestInterception(true);
    await page.setUserAgent(USER_AGENT);

    // This handler function captures the request URLs
    const requestHandler = async (request: {
      isInterceptResolutionHandled: () => any;
      url: () => string;
      continue: () => any;
    }) => {
      try {
        if (request.isInterceptResolutionHandled()) return;
        requests.push(request.url());
        await request.continue();
      } catch (error) {
        console.error('Error in request interception:', error);
        // Cleanup before rethrowing
        page.off('request', requestHandler);
        throw error;
      }
    };

    // Attach the handler
    page.on('request', requestHandler);

    try {
      await page.goto(url);
      await page.reload({ waitUntil: 'networkidle2' });
    } catch (error) {
      console.error('Error while navigating:', error);
      throw error;
    } finally {
      // Cleanup: Ensure the listener is removed to avoid potential memory leaks
      page.off('request', requestHandler);
      // It's a good practice to turn off request interception after done
      await page.setRequestInterception(false);
    }

    return requests;
  }
}
