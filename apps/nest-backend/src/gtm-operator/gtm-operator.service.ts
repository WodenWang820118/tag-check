import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Credentials } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { InspectEventDto } from '../dto/inspect-event.dto';
import { sleep } from '../web-agent/action/action-utils';
import { PipelineService } from '../pipeline/pipeline.service';

/**
 * A service for interacting with Google Tag Manager (GTM) via Puppeteer.
 * There are two main use cases:
 * 1) Inspecting a single event via GTM preview mode
 * 2) Inspecting all events via GTM preview mode to validate the GTM setup
 */
@Injectable()
export class GtmOperatorService {
  constructor(private pipelineService: PipelineService) {}

  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectName: string,
    testName: string,
    headless: string,
    filePath?: string,
    credentials?: Credentials,
    inspectEventDto?: InspectEventDto
  ) {
    // set the defaultViewport to null to use maximum viewport size
    const browser = await puppeteer.launch({
      headless: headless === 'true' ? 'new' : false,
      // devtools: true,
      defaultViewport: null,
      timeout: 30000,
      ignoreHTTPSErrors: true,
      // the window size may impact the examination result
      args:
        (inspectEventDto as any).inspectEventDto.puppeteerArgs || BROWSER_ARGS,
    });

    const incognitoContext = await browser.createIncognitoBrowserContext();
    const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
    // Logger.log(
    //   `Website URL: ${websiteUrl}`,
    //   'gtm-operator.inspectSingleEventViaGtm'
    // );
    const page = await incognitoContext.newPage();

    await page.goto(gtmUrl, { waitUntil: 'networkidle2' });
    await page.$('#include-debug-param').then((el) => el?.click());

    // 3) Start tag manager preview mode
    await page.$('#domain-start-button').then((el) => el?.click());

    // 4) Wait and close the initial blank page for cleaner operations
    await sleep(1000);
    // Close the initial blank page for cleaner operations
    const pages = await browser.pages();
    for (const subPage of pages) {
      if (subPage.url() === 'about:blank') {
        await subPage.close();
      }
    }

    // 5) Wait for the page to completely load
    const target = await browser.waitForTarget((target) =>
      target.url().includes(new URL(websiteUrl).origin)
    );

    const testingPage = await target.page();
    await sleep(1000);
    return this.pipelineService.singleEventInspectionRecipe(
      testingPage,
      projectName,
      testName,
      headless,
      filePath,
      undefined,
      credentials,
      inspectEventDto
    );
  }

  extractBaseUrlFromGtmUrl(gtmUrl: string) {
    const url = new URL(gtmUrl);
    const fragment = url.hash.substring(1); // Remove the '#' character
    const params = new URLSearchParams(fragment);
    const encodedUrl = params.get('url');

    if (encodedUrl) {
      const decodedUrl = decodeURIComponent(encodedUrl);
      Logger.log(
        new URL(decodedUrl).toString(),
        'GtmOperatorService.extractBaseUrlFromGtmUrl: decodedUrl'
      );
      return new URL(decodedUrl).toString();
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
