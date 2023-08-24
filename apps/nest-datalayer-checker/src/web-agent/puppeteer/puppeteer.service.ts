import { Injectable } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import * as puppeteer from 'puppeteer';

enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
}

@Injectable()
export class PuppeteerService {
  /**
   * Initializes and returns a browser instance
   * @param settings Optional browser settings
   * @returns A Promise resolving to the Browser instance
   */
  async initAndReturnBrowser(settings?: object) {
    return await puppeteer.launch(settings);
  }

  /**
   * Navigates to a URL and returns the page
   * @param url The URL to navigate to
   * @param browser The browser instance to use
   * @returns A Promise resolving to the Page instance
   */
  async nativateTo(url: string, browser: Browser) {
    const page = await browser.newPage();
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
  async httpAuth(page: Page, credentials: any) {
    await page.authenticate({
      username: credentials.username,
      password: credentials.password,
    });
  }
}
