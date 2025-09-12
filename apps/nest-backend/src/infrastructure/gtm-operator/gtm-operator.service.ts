import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { CookieData, Page, Browser } from 'puppeteer';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { EventInspectionPipelineService } from '../../features/event-inspection-pipeline/event-inspection-pipeline.service';
import { PuppeteerUtilsService } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';
import { InspectGtmQueryDto } from '../../controllers/gtm-operator/dto/inspect-gtm-query.dto';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';

@Injectable()
export class GtmOperatorService {
  private readonly logger = new Logger(GtmOperatorService.name);
  abortController: AbortController | null = null;
  constructor(
    private readonly eventInspectionPipelineService: EventInspectionPipelineService,
    private readonly puppeteerUtilsService: PuppeteerUtilsService,
    private readonly recordingRepositoryService: RecordingRepositoryService
  ) {}

  initializeAbortController() {
    this.abortController = new AbortController();
  }

  async inspectSingleEventViaGtm(
    projectSlug: string,
    eventId: string,
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

    // normalize headless flag consistently with PuppeteerUtilsService
    const headlessFlag = query.headless === 'true' || query.headless === '1';

    // extract cookie setting logic to helper
    await this.applyCookies(browser, query.gtmUrl, eventInspectionPresetDto);

    const websiteUrl = this.extractBaseUrlFromGtmUrl(query.gtmUrl);
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
      // Apply the recorded viewport to the actual page we'll record (targetPage)
      await this.puppeteerUtilsService.applyRecordedViewport(
        targetPage,
        projectSlug,
        eventId
      );
      await targetPage.bringToFront();
      await targetPage.goto(origin);

      const recorder = await this.puppeteerUtilsService.startRecorder(
        targetPage,
        projectSlug,
        eventId
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const data =
        await this.eventInspectionPipelineService.singleEventInspectionRecipe(
          targetPage,
          projectSlug,
          eventId,
          query.measurementId,
          { username: query.username || '', password: query.password || '' },
          query.captureRequest || 'false',
          eventInspectionPresetDto
        );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await recorder.stop();

      if (headlessFlag) {
        const pages = await browser.pages();
        await Promise.all(pages.map((page) => page.close()));
        await browser.close();
      } else {
        this.logger.log(
          'Headful mode detected (GTM): leaving browser open for user interaction. Close it manually when done.'
        );
      }
      return data;
    } catch (error) {
      this.logger.error(error);

      if (headlessFlag) {
        await this.puppeteerUtilsService.cleanup(browser, page);
      } else {
        this.logger.log(
          'Headful mode detected (GTM) and an error occurred: skipping automatic cleanup so the browser remains open for debugging.'
        );
      }
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
