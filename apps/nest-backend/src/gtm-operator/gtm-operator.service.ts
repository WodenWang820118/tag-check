/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { sleep } from '../web-agent/action/action-utils';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { PuppeteerUtilsService } from '../web-agent/puppeteer-utils/puppeteer-utils.service';
import { FolderPathService } from '../os/path/folder-path/folder-path.service';

@Injectable()
export class GtmOperatorService {
  constructor(
    private eventInspectionPipelineService: EventInspectionPipelineService,
    private puppeteerUtilsService: PuppeteerUtilsService,
    private folderPathService: FolderPathService
  ) {}

  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectSlug: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    const { browser, page } = await this.puppeteerUtilsService.startBrowser(
      projectSlug,
      eventId,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto
    );
    const context = await browser.createBrowserContext();
    const contextPage = await context.newPage();
    const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );

    await this.operateGtmPreviewMode(page, gtmUrl);
    // await this.operateGtmPreviewMode(contextPage, gtmUrl);
    await sleep(1000);

    const pages = await browser.pages();
    // const pages = await context.pages();
    for (const subPage of pages) {
      if (subPage.url() === 'about:blank') {
        await subPage.close();
      }
    }

    const target = await browser.waitForTarget(
      (target: { url: () => string | string[] }) =>
        target.url().includes(new URL(websiteUrl).origin)
    );

    const url = new URL(target.url());
    const origin = url.origin;
    Logger.log(`${url.origin}`, 'Target URL');
    const targetPage = await target.asPage(); // for using the screencast error-free

    if (!targetPage) {
      throw new Error('Failed to find the target page');
    }

    try {
      // let users to record it to navigate the target page
      // it's valid to use the url.origin to ensure the screencast recorder work as expected
      // without goto, the rest of the code will not work
      await targetPage.goto(origin);

      const recorder = await this.puppeteerUtilsService.startRecorder(
        targetPage,
        folder
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const data =
        await this.eventInspectionPipelineService.singleEventInspectionRecipe(
          targetPage,
          projectSlug,
          eventId,
          headless,
          measurementId,
          credentials,
          eventInspectionPresetDto
        );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await recorder.stop();
      return data;
    } catch (error) {
      Logger.error(
        error,
        `${GtmOperatorService.name}.${GtmOperatorService.prototype.inspectSingleEventViaGtm.name}`
      );

      // await this.puppeteerUtilsService.cleanup(browser, page);
      await this.puppeteerUtilsService.cleanup(browser, contextPage);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
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

    return '';
  }

  stopOperation() {
    this.puppeteerUtilsService.stopOperation();
  }
}
