import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { Page } from 'puppeteer';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { RunQueueService } from '../event-inspection-pipeline/run-queue.service';
import { RunTrackerService } from '../event-inspection-pipeline/run-tracker.service';
import {
  isHeadless,
  PuppeteerUtilsService
} from '../web-agent/puppeteer-utils/puppeteer-utils.service';
import { RunRecorder } from '../web-agent/puppeteer-utils/run-recorder';
import { InspectGtmQueryDto } from '../../shared/dto/gtm-operator';
import { RECORDING_FILES, toClientErrorMessage } from '../../shared';
import type { RunStatusBatch } from '@utils';
import {
  applyPresetCookies,
  preloadApplicationLocalStorage,
  seedSiteLocalStorage
} from '../web-agent/browser-state-preload.util';
import {
  connectTagAssistant,
  GtmPreviewConnectionError
} from './tag-assistant-connection';

/**
 * Preview mode pins Tag Assistant's badge (an iframe, 450x200, maximum
 * z-index) to the bottom-right corner of the site, where it swallows clicks
 * on whatever sits underneath, such as a checkout's submit button. The badge
 * stays visible; clicks pass through it. Source text, because the ES5 bundle
 * would add swc helpers to a function that the page lacks.
 */
export const TAG_ASSISTANT_BADGE_PASSTHROUGH = `(function () {
  function addStyle() {
    var style = document.createElement('style');
    style.textContent = '.__TAG_ASSISTANT_BADGE { pointer-events: none !important; }';
    (document.head || document.documentElement).appendChild(style);
  }
  if (document.documentElement) addStyle();
  else document.addEventListener('DOMContentLoaded', addStyle);
})();`;

/**
 * Runs one test in accompanied mode: opens the GTM preview URL, lets Tag
 * Assistant open the site, then records both tabs while the inspection
 * pipeline replays the recording on the site's tab and saves the result.
 *
 * A headless run always closes its browser. A headful run is left open for
 * the user to inspect, unless the caller passes `closeBrowser=true`, as a
 * batch does.
 */
@Injectable()
export class GtmOperatorService {
  private readonly logger = new Logger(GtmOperatorService.name);
  constructor(
    private readonly eventInspectionPipelineService: EventInspectionPipelineService,
    private readonly puppeteerUtilsService: PuppeteerUtilsService,
    private readonly runQueue: RunQueueService,
    private readonly runTracker: RunTrackerService
  ) {}

  /**
   * Runs the test once every run requested before it has finished. Resolves
   * with the pipeline's result. Rejects with BadRequestException for a GTM
   * preview URL without a target site, and InternalServerErrorException for
   * any other failure, with the failure's reason in its message. `batch`
   * places the run in its batch for the run status.
   */
  inspectSingleEventViaGtm(
    projectSlug: string,
    eventId: string,
    query: InspectGtmQueryDto,
    eventInspectionPresetDto: EventInspectionPresetDto,
    batch?: RunStatusBatch
  ) {
    return this.runQueue.run((signal) =>
      this.runTracker.track({ projectSlug, eventId, batch }, signal, () =>
        this.inspectViaGtm(
          projectSlug,
          eventId,
          query,
          eventInspectionPresetDto,
          signal
        )
      )
    );
  }

  private async inspectViaGtm(
    projectSlug: string,
    eventId: string,
    query: InspectGtmQueryDto,
    eventInspectionPresetDto: EventInspectionPresetDto,
    signal: AbortSignal
  ) {
    const { browser, page } = await this.puppeteerUtilsService.startBrowser(
      query.headless || 'false',
      query.measurementId,
      eventInspectionPresetDto,
      signal
    );

    // A headful run is left open for inspection unless the caller (a batch)
    // asks to close it.
    const closeBrowser =
      isHeadless(query.headless) || query.closeBrowser === 'true';
    let recorder: RunRecorder | null = null;
    let tagAssistantRecorder: RunRecorder | null = null;
    try {
      const websiteUrl = this.getPreviewTargetUrl(query.gtmUrl);
      await applyPresetCookies(
        browser,
        websiteUrl,
        eventInspectionPresetDto.application
      );
      await seedSiteLocalStorage(
        browser,
        websiteUrl,
        eventInspectionPresetDto.application
      );
      await this.operateGtmPreviewMode(page, query.gtmUrl);
      // Gives Tag Assistant time to open the site's window.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Closes leftover blank tabs, so the target lookup below sees only
      // the preview and the site.
      for (const subPage of await browser.pages()) {
        if (subPage.url() === 'about:blank') {
          await subPage.close();
        }
      }

      // The site's tab is the one Tag Assistant opened on the site's origin.
      const siteOrigin = new URL(websiteUrl).origin;
      const target = await browser.waitForTarget((candidate) =>
        candidate.url().includes(siteOrigin)
      );

      const targetUrl = target.url();
      // A Page handle is needed for the screencast and the replay.
      const targetPage = await target.asPage();
      if (!targetPage) {
        throw new Error('Failed to find the target page');
      }

      await this.puppeteerUtilsService.applyRecordedViewport(
        targetPage,
        projectSlug,
        eventId
      );
      await targetPage.bringToFront();
      // The init scripts apply from the next document on, so the site is
      // loaded again once they are registered.
      await targetPage.evaluateOnNewDocument(TAG_ASSISTANT_BADGE_PASSTHROUGH);
      await preloadApplicationLocalStorage(
        targetPage,
        eventInspectionPresetDto.application
      );
      await targetPage.goto(targetUrl);

      recorder = await this.puppeteerUtilsService.startRecorder(
        targetPage,
        projectSlug,
        eventId,
        signal
      );
      tagAssistantRecorder = await this.startTagAssistantRecorder(
        page,
        projectSlug,
        eventId,
        signal
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
      // Lets both recordings show the tags that fired at the end of the
      // journey before they stop.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await this.puppeteerUtilsService.stopRecorder(recorder);
      await this.puppeteerUtilsService.stopRecorder(tagAssistantRecorder);

      if (closeBrowser) {
        // Bounded close: Tag Assistant can hold a headful browser open, and
        // an unbounded close left the request (and a batch) waiting forever.
        await this.puppeteerUtilsService.cleanup(browser, page, null);
      } else {
        this.logger.log(
          'Headful mode detected (GTM): leaving browser open for user interaction. Close it manually when done.'
        );
      }
      return data;
    } catch (error) {
      this.logger.error(error);
      if (tagAssistantRecorder) {
        await this.puppeteerUtilsService
          .stopRecorder(tagAssistantRecorder)
          .catch((err) =>
            this.logger.error(`Error stopping Tag Assistant recorder: ${err}`)
          );
      }

      if (closeBrowser) {
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
      // Tag Assistant did not connect: the user sees why in plain words; the
      // technical detail is in the log above.
      if (error instanceof GtmPreviewConnectionError) {
        throw new InternalServerErrorException(error.clientMessage);
      }
      // The batch shows this message, so it says why the run failed, without
      // a stack trace or a file path.
      const reason = toClientErrorMessage(error);
      throw new InternalServerErrorException(
        reason
          ? `Failed to perform GTM validation: ${reason}`
          : 'Failed to perform GTM validation'
      );
    }
  }

  /**
   * Records the Tag Assistant tab, which lists the tags that fire while the
   * site's journey replays. The run does not depend on it: a recorder that
   * fails to start is logged and the run goes on with the site recording.
   */
  private async startTagAssistantRecorder(
    page: Page,
    projectSlug: string,
    eventId: string,
    signal: AbortSignal
  ): Promise<RunRecorder | null> {
    try {
      return await this.puppeteerUtilsService.startRecorder(
        page,
        projectSlug,
        eventId,
        signal,
        { file: RECORDING_FILES.tagAssistant, bringToFront: false }
      );
    } catch (error) {
      this.logger.warn(`Tag Assistant was not recorded: ${error}`);
      return null;
    }
  }

  /**
   * Opens Tag Assistant on the GTM preview URL and connects it to the site
   * (see connectTagAssistant). Rejects with GtmPreviewConnectionError when
   * Tag Assistant does not connect.
   */
  async operateGtmPreviewMode(page: Page, gtmUrl: string) {
    const siteOrigin = new URL(this.getPreviewTargetUrl(gtmUrl)).origin;
    await page.goto(gtmUrl, { waitUntil: 'networkidle2' });
    await connectTagAssistant(page, {
      siteOrigin,
      log: (message) => this.logger.log(message)
    });
  }

  /**
   * Returns the site URL a Tag Assistant URL carries in its `#url=` fragment,
   * or an empty string when it carries none. Throws on a malformed URL.
   */
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

  /**
   * Aborts the run in progress, which closes its browser, and drops the runs
   * queued behind it.
   */
  stopOperation() {
    this.runQueue.stop();
  }
}
