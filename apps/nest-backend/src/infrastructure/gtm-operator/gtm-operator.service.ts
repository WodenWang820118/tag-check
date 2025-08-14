import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { CookieData, Page, Browser } from 'puppeteer';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { EventInspectionPipelineService } from '../../features/event-inspection-pipeline/event-inspection-pipeline.service';
import { PuppeteerUtilsService } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';
import { FolderPathService } from '../os/path/folder-path/folder-path.service';
import { InspectGtmQueryDto } from '../../controllers/gtm-operator/dto/inspect-gtm-query.dto';

@Injectable()
export class GtmOperatorService {
  private readonly logger = new Logger(GtmOperatorService.name);
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
    projectSlug: string,
    eventName: string,
    query: InspectGtmQueryDto,
    eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    this.initializeAbortController();
    if (!this.abortController) {
      throw new InternalServerErrorException(
        'Abort controller is not initialized'
      );
    }
    const { browser, page } = await this.puppeteerUtilsService.startBrowser(
      query.headless || 'false',
      query.measurementId,
      eventInspectionPresetDto,
      this.abortController.signal
    );

    // extract cookie setting logic to helper
    await this.applyCookies(browser, query.gtmUrl, eventInspectionPresetDto);

    const websiteUrl = this.extractBaseUrlFromGtmUrl(query.gtmUrl);
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventName
    );

    await this.operateGtmPreviewMode(page, query.gtmUrl);
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
          eventName,
          query.measurementId,
          { username: query.username || '', password: query.password || '' },
          query.captureRequest || 'false',
          eventInspectionPresetDto
        );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await recorder.stop();
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
      await browser.close();
      return data;
    } catch (error) {
      this.logger.error(error);

      await this.puppeteerUtilsService.cleanup(browser, page);
      throw new InternalServerErrorException(
        'Failed to perform GTM validation'
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

  // helper to apply cookies from preset
  private async applyCookies(
    browser: Browser,
    url: string,
    eventInspectionPresetDto: EventInspectionPresetDto
  ): Promise<void> {
    if (!eventInspectionPresetDto.application.cookie.data.length) {
      return;
    }
    const cookies = eventInspectionPresetDto.application.cookie.data.map(
      (cookie) => ({
        name: cookie.key.toString(),
        value: cookie.value.toString()
      })
    );
    const cookieData: CookieData[] = cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: new URL(url).hostname
    }));
    await browser.setCookie(...cookieData);
  }
}
