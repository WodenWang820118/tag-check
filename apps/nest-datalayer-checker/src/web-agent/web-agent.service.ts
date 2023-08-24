import { Injectable } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { ActionService } from './action/action.service';
import { AnalysisService } from './analysis/analysis.service';
import { Browser } from 'puppeteer';

@Injectable()
export class WebAgentService {
  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly actionService: ActionService,
    private readonly analysisService: AnalysisService,
  ) {}

  /**
   * Performs an operation on a page and retrieves the data layer
   * @param operation The operation to perform
   * @returns A Promise resolving to an array of data layer objects
   */
  async executeAndGetDataLayer(
    name: string,
    args: string,
    headless: string,
    path: string,
  ) {
    try {
      const operation = this.actionService.getOperationJson(name, path);
      const browser = await this.puppeteerService.initAndReturnBrowser({
        headless: headless === 'true' ? true : false,
      });
      await this.puppeteerService.nativateTo(operation.steps[1].url, browser); // navigate to designated URL
      const pages = await browser.pages(); // get all pages
      const page = pages[pages.length - 1]; // last page opened since when opening a brwoser, there's a default page
      await this.actionService.performOperation(page, operation);
      await browser.close();
      return await this.analysisService.getDataLayer(page);
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  /**
   * Initializes Puppeteer, navigates to a URL, retrieves the data layer, and closes the browser
   * @param url The URL to navigate to
   * @returns A Promise resolving to an array of data layer objects
   */
  async fetchDataLayer(url: string) {
    const browser = await this.puppeteerService.initAndReturnBrowser();
    const page = await this.puppeteerService.nativateTo(url, browser);
    const result = await this.analysisService.getDataLayer(page);
    await browser.close();
    return result;
  }

  async getGtmTestingPage(gtmUrl: string, browser: Browser) {
    return this.puppeteerService.nativateTo(gtmUrl, browser);
  }

  async getCurrentBrowser(args?: string, headless?: string) {
    return await this.puppeteerService.initAndReturnBrowser({
      headless: headless.toLowerCase() === 'true' ? true : false || false,
      args: args.split(','),
    });
  }

  getGcs(requests: string[]) {
    return this.analysisService.getGcs(requests);
  }
}
