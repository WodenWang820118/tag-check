import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Credentials } from 'puppeteer';
import { InspectorGroupEventsService } from '../inspector/inspector-group-events.service';
import { BROWSER_ARGS } from '../configs/project.config';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';

/**
 * A service for interacting with Google Tag Manager (GTM) via Puppeteer.
 * There are two main use cases:
 * 1) Inspecting a single event via GTM preview mode
 * 2) Inspecting all events via GTM preview mode to validate the GTM setup
 */
@Injectable()
export class GtmOperatorService {
  constructor(
    private inspectorGroupEventsService: InspectorGroupEventsService,
    private inspectorSingleEventService: InspectorSingleEventService
  ) {}

  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectName: string,
    testName: string,
    headless: string,
    filePath?: string,
    credentials?: Credentials
  ) {
    // set the defaultViewport to null to use maximum viewport size
    const browser = await puppeteer.launch({
      headless: headless === 'new' ? 'new' : false,
      // devtools: true,
      defaultViewport: null,
      timeout: 30000,
      ignoreHTTPSErrors: true,
      // the window size may impact the examination result
      args: BROWSER_ARGS,
    });

    const incognitoContext = await browser.createIncognitoBrowserContext();
    const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
    Logger.log(
      `Website URL: ${websiteUrl}`,
      'gtm-operator.inspectSingleEventViaGtm'
    );
    const page = await incognitoContext.newPage();

    await page.goto(gtmUrl, { waitUntil: 'networkidle2' });
    await page.$('#include-debug-param').then((el) => el?.click());

    // 3) Start tag manager preview mode
    await page.$('#domain-start-button').then((el) => el?.click());

    // 4) Wait for the page to completely load
    const target = await browser.waitForTarget((target) =>
      target.url().includes(websiteUrl)
    );

    const testingPage = await target.page();
    // Close the initial blank page for cleaner operations
    const pages = await browser.pages();
    if (pages.length > 0 && pages[0].url() === 'about:blank') {
      await pages[0].close();
    }

    try {
      await this.inspectorSingleEventService.inspectDataLayer(
        testingPage,
        projectName,
        testName,
        headless,
        filePath,
        undefined,
        credentials
      );
    } catch (error) {
      Logger.error(error.message, 'inspector.inspectProjectDataLayer');
    }
  }

  extractBaseUrlFromGtmUrl(gtmUrl: string) {
    const url = new URL(gtmUrl);
    const fragment = url.hash.substring(1); // Remove the '#' character
    const params = new URLSearchParams(fragment);
    const encodedUrl = params.get('url');

    if (encodedUrl) {
      const decodedUrl = decodeURIComponent(encodedUrl);
      return new URL(decodedUrl).origin; // This will return the base URL
    }

    return null;
  }

  // TODO: GTM setup QA automation
  async inspectAllEventsViaGtm(
    gtmUrl: string,
    projectName: string,
    headless: string,
    filePath?: string,
    credentials?: Credentials
  ) {
    // TODO: one GTM url for all events
  }
}
