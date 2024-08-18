import { Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials, Page } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { sleep } from '../web-agent/action/action-utils';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';

/**
 * A service for interacting with Google Tag Manager (GTM) via Puppeteer.
 * There are two main use cases:
 * 1) Inspecting a single event via GTM preview mode
 * 2) Inspecting all events via GTM preview mode to validate the GTM setup
 */
@Injectable()
export class GtmOperatorService {
  constructor(
    private eventInspectionPipelineService: EventInspectionPipelineService
  ) {}
  private abortController: AbortController | null = null;
  private currentBrowser: Browser | null = null;
  private currentPage: Page | null = null;

  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectName: string,
    testName: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    // set the defaultViewport to null to use maximum viewport size
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR.getStats(options);
    try {
      this.currentBrowser = await stats.puppeteer.launch({
        headless: headless === 'true' ? true : false,
        devtools: measurementId ? true : false,
        defaultViewport: null,
        timeout: 30000,
        ignoreHTTPSErrors: true,
        // the window size may impact the examination result
        args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
        executablePath: stats.executablePath,
        signal: signal,
      });

      const incognitoContext = await this.currentBrowser.createBrowserContext();
      const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
      const page = await incognitoContext.newPage();
      await this.operateGtmPreviewMode(page, gtmUrl);
      await sleep(1000);
      // Close the initial blank page for cleaner operations
      const pages = await this.currentBrowser.pages();
      for (const subPage of pages) {
        if (subPage.url() === 'about:blank') {
          await subPage.close();
        }
      }
      // 5) Wait for the page to completely load
      await sleep(1000);

      const target = await this.currentBrowser.waitForTarget((target) =>
        target.url().includes(new URL(websiteUrl).origin)
      );

      // TODO: Using the preview mode cannot intercept the network requests
      this.currentPage = await target.page();
      await sleep(1000);

      // Set up an abort listener
      signal.addEventListener(
        'abort',
        async () => {
          await this.cleanup();
        },
        { once: true }
      );

      return await this.eventInspectionPipelineService.singleEventInspectionRecipe(
        this.currentPage,
        projectName,
        testName,
        headless,
        measurementId,
        credentials,
        eventInspectionPresetDto
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        Logger.error(
          'Operation was aborted',
          `${GtmOperatorService.name}.${GtmOperatorService.prototype.inspectSingleEventViaGtm.name}`
        );
      } else {
        Logger.error(
          error,
          `${GtmOperatorService.name}.${GtmOperatorService.prototype.inspectSingleEventViaGtm.name}`
        );
      }
      throw error;
    }
  }

  async operateGtmPreviewMode(page: Page, gtmUrl: string) {
    Logger.log(
      'Operating GTM preview mode',
      `${GtmOperatorService.name}.${GtmOperatorService.prototype.operateGtmPreviewMode.name}`
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
        `Decoded URL: ${new URL(decodedUrl).toString()}`,
        `${GtmOperatorService.name}.${GtmOperatorService.prototype.extractBaseUrlFromGtmUrl.name}`
      );
      return new URL(decodedUrl).toString();
    }

    return null;
  }

  stopOperation() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async cleanup() {
    Logger.log(
      'Cleaning up resources',
      `${GtmOperatorService.name}.${GtmOperatorService.prototype.cleanup.name}`
    );
    if (this.currentBrowser) {
      try {
        // Close all pages
        const pages = await this.currentBrowser.pages();
        await Promise.all(pages.map((page) => page.close()));
        await this.currentBrowser.close();
      } catch (err) {
        Logger.error(
          'Error during cleanup' + err,
          `${GtmOperatorService.name}.${GtmOperatorService.prototype.cleanup.name}`
        );
      } finally {
        this.currentBrowser = null;
        this.currentPage = null;
        this.abortController = null;
      }
    }
  }
}
