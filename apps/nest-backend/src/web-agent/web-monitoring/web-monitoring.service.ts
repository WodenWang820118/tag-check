import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { RequestService } from './request/request.service';

@Injectable()
export class WebMonitoringService {
  constructor(private requestService: RequestService) {}

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
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const [page] = await browser.pages();
      const result = await this.getInstalledGtms(page, url);
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
    await this.requestService.initializeRequestCapture(page);

    try {
      await page.goto(url);
      await page.reload({ waitUntil: 'networkidle2' });
    } catch (error) {
      console.error('Error while navigating:', error);
      throw error;
    }
    return await this.requestService.stopRequestCapture(page);
  }
}