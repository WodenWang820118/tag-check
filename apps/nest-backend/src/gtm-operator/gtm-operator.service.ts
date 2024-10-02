/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { PuppeteerUtilsService } from '../web-agent/puppeteer-utils/puppeteer-utils.service';
import { FolderPathService } from '../os/path/folder-path/folder-path.service';

@Injectable()
export class GtmOperatorService {
  abortController: AbortController | null = null;
  constructor(
    private readonly eventInspectionPipelineService: EventInspectionPipelineService,
    private readonly puppeteerUtilsService: PuppeteerUtilsService,
    private readonly folderPathService: FolderPathService
  ) {}

  initializeAbortController() {
    this.abortController = new AbortController();
  }

  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectSlug: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    this.initializeAbortController();
    if (!this.abortController) {
      throw new InternalServerErrorException(
        'Abort controller is not initialized'
      );
    }
    const { browser, page } = await this.puppeteerUtilsService.startBrowser(
      projectSlug,
      eventId,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto,
      this.abortController.signal
    );

    const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );

    await this.operateGtmPreviewMode(page, gtmUrl);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pages = await browser.pages();
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
          captureRequest,
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

      await this.puppeteerUtilsService.cleanup(browser, page);
      throw new HttpException(
        'Failed to perform GTM validation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async operateGtmPreviewMode(page: Page, gtmUrl: string) {
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
      return new URL(decodedUrl).toString();
    }

    return '';
  }

  stopOperation() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
