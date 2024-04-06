import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Credentials, Page } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
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
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    // set the defaultViewport to null to use maximum viewport size
    const browser = await puppeteer.launch({
      headless: headless === 'true' ? true : false,
      devtools: measurementId ? true : false,
      defaultViewport: null,
      timeout: 30000,
      ignoreHTTPSErrors: true,
      // the window size may impact the examination result
      args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
    });

    const incognitoContext = await browser.createBrowserContext();
    const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
    const page = await incognitoContext.newPage();
    await this.operateGtmPreviewMode(page, gtmUrl);
    await sleep(1000);
    // Close the initial blank page for cleaner operations
    const pages = await browser.pages();
    for (const subPage of pages) {
      if (subPage.url() === 'about:blank') {
        await subPage.close();
      }
    }
    // 5) Wait for the page to completely load
    await sleep(1000);

    const target = await browser.waitForTarget((target) =>
      target.url().includes(new URL(websiteUrl).origin)
    );

    // TODO: Using the preview mode cannot intercept the network requests
    const testingPage = await target.page();
    await sleep(1000);
    return this.pipelineService.singleEventInspectionRecipe(
      testingPage,
      projectName,
      testName,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto
    );
  }

  async operateGtmPreviewMode(page: Page, gtmUrl: string) {
    Logger.log(
      'Operating GTM preview mode',
      'gtm-operator.operateGtmPreviewMode'
    );

    await page.goto(gtmUrl, { waitUntil: 'networkidle2' });
    await page.$('#include-debug-param').then((el) => el?.click());

    // 3) Start tag manager preview mode
    await page.$('#domain-start-button').then((el) => el?.click());

    const btnSelector = '.btn.btn--filled.wd-continue-debugging-button';
    await page.waitForSelector(btnSelector, { visible: true });
    await page.$(btnSelector).then((el) => el?.click());
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
}
