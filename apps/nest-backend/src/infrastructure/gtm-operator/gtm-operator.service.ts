import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { CookieData, Page, Browser, ScreenRecorder } from 'puppeteer';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { EventInspectionPipelineService } from '../../features/event-inspection-pipeline/event-inspection-pipeline.service';
import { PuppeteerUtilsService } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';
import { InspectGtmQueryDto } from '../../shared/dto/gtm-operator';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';
import { preloadApplicationLocalStorage } from '../../features/web-agent/browser-state-preload.util';

@Injectable()
export class GtmOperatorService {
  private readonly logger = new Logger(GtmOperatorService.name);
  // NOTE(stage2): Replace singleton abort routing with per-operation session IDs.
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
    let recorder: ScreenRecorder | null = null;
    try {
      const websiteUrl = this.getPreviewTargetUrl(query.gtmUrl);
      await this.applyCookies(browser, websiteUrl, eventInspectionPresetDto);
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

      const targetUrl = target.url();
      const targetPage = await target.asPage(); // for using the screencast error-free
      if (!targetPage) {
        throw new Error('Failed to find the target page');
      }

      // Apply the recorded viewport to the actual page we'll record (targetPage)
      await this.puppeteerUtilsService.applyRecordedViewport(
        targetPage,
        projectSlug,
        eventId
      );
      await targetPage.bringToFront();
      await preloadApplicationLocalStorage(
        targetPage,
        eventInspectionPresetDto.application
      );
      await targetPage.goto(targetUrl);

      recorder = await this.puppeteerUtilsService.startRecorder(
        targetPage,
        projectSlug,
        eventId,
        this.abortController.signal
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
      await this.puppeteerUtilsService.stopRecorder(recorder);

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
        await this.puppeteerUtilsService.cleanup(browser, page, recorder);
      } else {
        await this.puppeteerUtilsService
          .stopRecorder(recorder)
          .catch((err) => this.logger.error(`Error stopping recorder: ${err}`));
        this.logger.log(
          'Headful mode detected (GTM) and an error occurred: skipping automatic cleanup so the browser remains open for debugging.'
        );
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to perform GTM validation'
      );
    }
  }

  async operateGtmPreviewMode(page: Page, gtmUrl: string) {
    await page.goto(gtmUrl, { waitUntil: 'networkidle2' });
    await this.clickRequiredPreviewControl(page, '#include-debug-param');

    // 3) Start tag manager preview mode
    await this.clickRequiredPreviewControl(page, '#domain-start-button');

    const btnSelector = '.btn.btn--filled.wd-continue-debugging-button';
    await this.clickRequiredPreviewControl(page, btnSelector);
  }

  private async clickRequiredPreviewControl(
    page: Page,
    selector: string
  ): Promise<void> {
    try {
      await page.waitForSelector(selector, { visible: true });
      await page.click(selector);
    } catch (error) {
      throw new Error(
        `Failed to operate GTM preview control "${selector}": ${error}`
      );
    }
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

  private getPreviewTargetUrl(gtmUrl: string): string {
    try {
      const websiteUrl = this.extractBaseUrlFromGtmUrl(gtmUrl);
      if (!websiteUrl) {
        throw new BadRequestException(
          'GTM preview URL must include a target website URL'
        );
      }

      return websiteUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid GTM preview URL');
    }
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
