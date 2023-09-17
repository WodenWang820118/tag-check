import { Injectable } from '@nestjs/common';
import {
  Browser,
  BrowserLaunchArgumentOptions,
  Credentials,
  Page,
} from 'puppeteer';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService {
  /**
   * Initializes and returns a browser instance
   * @param settings Optional browser settings
   * @returns A Promise resolving to the Browser instance
   */
  async initAndReturnBrowser(settings: BrowserLaunchArgumentOptions) {
    return await puppeteer.launch(settings);
  }

  /**
   * Navigates to a URL and returns the page
   * @param url The URL to navigate to
   * @param browser The browser instance to use
   * @returns A Promise resolving to the Page instance
   */
  async navigateTo(url: string, browser: Browser, credentials?: Credentials) {
    const page = await browser.newPage();
    if (credentials) {
      await this.httpAuth(page, credentials);
    }
    await page.goto(url);
    return page;
  }

  // ------------------ Utilties ------------------

  /**
   * Performs HTTP authentication on a page
   * @param page The page to authenticate
   * @param credentials The authentication credentials
   * @returns A Promise resolving when authentication is complete
   */
  async httpAuth(page: Page, credentials: puppeteer.Credentials) {
    await page.authenticate({
      username: credentials.username,
      password: credentials.password,
    });
  }

  async snapshot(page: Page, path: string) {
    await page.screenshot({ path });
  }
}
