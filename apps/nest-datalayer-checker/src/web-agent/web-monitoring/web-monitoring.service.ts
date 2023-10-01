import { HttpException, Injectable } from '@nestjs/common';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { Page } from 'puppeteer';
import { USER_AGENT } from '../../configs/puppeteer.config';

@Injectable()
export class WebMonitoringService {
  private requests: string[] = [];
  constructor(private puppeteerService: PuppeteerService) {}

  /**
   * Retrieves the data layer from a page
   * @param page The page to retrieve the data layer from
   * @param timeout Optional time in milliseconds to wait before retrieving the data layer
   * @returns A Promise resolving to an array of data layer objects
   */
  async getDataLayer(page: Page, timeout = 2000) {
    try {
      await page.waitForFunction(
        () => typeof window.dataLayer !== 'undefined',
        { timeout: 5000 } // timeout here to fail fast if needed
      );
      await new Promise((resolve) => setTimeout(resolve, timeout));
      const dataLayer = await page.evaluate(() => {
        console.log(window.dataLayer); // Debug line to understand what's in dataLayer
        return window.dataLayer;
      });
      if (!dataLayer) {
        console.error('DataLayer is empty or undefined');
        throw new Error('DataLayer is empty or undefined');
      }
      return dataLayer;
    } catch (error) {
      // throw new Error(error);
      throw new HttpException(
        'DataLayer is empty or undefined',
        error.status || 500
      );
    }
  }

  /**
   * Retrieves the Google Click ID (GCLID) values from an array of request URLs
   * @param requests The array of request URLs to retrieve GCLIDs from
   * @returns An array of GCLID values
   */
  getGcs(requests: string[]) {
    if (!requests) return [];
    return requests.map((request) => request.split('gcs=')[1].split('&')[0]);
  }

  /**
   * Retrieves the Google Tag Manager IDs installed on a page
   * @param page The page to retrieve the IDs from
   * @param url The URL of the page
   * @returns A Promise resolving to an array of GTM
   */
  async getInstalledGtms(page: Page, url: string) {
    const requests = await this.getAllRequests(page, url);
    const gtmRequests = requests.filter((request) =>
      request.includes('collect?v=2')
    );
    if (gtmRequests.length > 0) {
      const installedGtms = gtmRequests.map(
        (request) => request.split('tid=')[1].split('&')[0]
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
    const browser = await this.puppeteerService.initAndReturnBrowser({
      headless: true,
    });

    try {
      const page = await this.puppeteerService.navigateTo(url, browser);
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
    await this.initializeRequestCapture(page);

    try {
      await page.goto(url);
      await page.reload({ waitUntil: 'networkidle2' });
    } catch (error) {
      console.error('Error while navigating:', error);
      throw error;
    }
    return await this.stopRequestCapture(page);
  }

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
