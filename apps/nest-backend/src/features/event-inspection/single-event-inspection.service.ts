import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '@utils';
import { EventInspectionPipelineService } from '../../features/event-inspection-pipeline/event-inspection-pipeline.service';
import {
  isHeadless,
  PuppeteerUtilsService
} from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';
import { RunRecorder } from '../../features/web-agent/puppeteer-utils/run-recorder';
import { applyPresetCookies } from '../web-agent/browser-state-preload.util';
import { RunQueueService } from '../event-inspection-pipeline/run-queue.service';
import { toClientErrorMessage } from '../../shared/client-error-message';

/** What a direct run needs besides the test it runs. */
export interface InspectSingleEventOptions {
  /** "true" or "1" for a headless browser; a headful one is left open. */
  headless: string;
  measurementId: string;
  credentials: Credentials;
  captureRequest: string;
  /** The site the preset's cookies are set on. */
  url: string;
  eventInspectionPresetDto: EventInspectionPresetDto;
}

/**
 * Runs one test directly against the site (not through GTM Preview): opens a
 * browser, records the page and hands it to the inspection pipeline, which
 * replays the recording and saves the result.
 *
 * A headless run always closes its browser. A headful run leaves its browser
 * open, after success or failure, so the user can inspect the page.
 */
@Injectable()
export class SingleEventInspectionService {
  private readonly logger = new Logger(SingleEventInspectionService.name);

  constructor(
    private readonly eventInspectionPipelineService: EventInspectionPipelineService,
    private readonly puppeteerUtilsService: PuppeteerUtilsService,
    private readonly runQueue: RunQueueService
  ) {}

  /**
   * Runs the test once every run requested before it has finished. Resolves
   * with the pipeline's result; rejects with an HttpException (500) when the
   * run fails.
   */
  inspectSingleEvent(
    projectSlug: string,
    eventId: string,
    options: InspectSingleEventOptions
  ) {
    return this.runQueue.run((signal) =>
      this.inspect(projectSlug, eventId, options, signal)
    );
  }

  private async inspect(
    projectSlug: string,
    eventId: string,
    options: InspectSingleEventOptions,
    signal: AbortSignal
  ) {
    const {
      headless,
      measurementId,
      credentials,
      captureRequest,
      url,
      eventInspectionPresetDto
    } = options;
    const headlessFlag = isHeadless(headless);
    const { browser, page } = await this.puppeteerUtilsService.startBrowser(
      headless,
      measurementId,
      eventInspectionPresetDto,
      signal
    );
    let recorder: RunRecorder | null = null;

    // Everything after the launch is inside the try, so a failure in the
    // set-up (an invalid site URL, ffmpeg missing) still closes the browser.
    try {
      await applyPresetCookies(
        browser,
        url,
        eventInspectionPresetDto.application
      );
      await this.puppeteerUtilsService.applyRecordedViewport(
        page,
        projectSlug,
        eventId
      );
      recorder = await this.puppeteerUtilsService.startRecorder(
        page,
        projectSlug,
        eventId,
        signal
      );
      // Gives the recording a moment of the page before the replay starts.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const data =
        await this.eventInspectionPipelineService.singleEventInspectionRecipe(
          page,
          projectSlug,
          eventId,
          measurementId,
          credentials,
          captureRequest,
          eventInspectionPresetDto
        );

      await this.puppeteerUtilsService.stopRecorder(recorder);
      if (headlessFlag) {
        // Bounded close: an unbounded one could hold the run queue forever.
        await this.puppeteerUtilsService.cleanup(browser, page, null);
      } else {
        this.logger.log(
          'Headful mode detected: leaving browser open for user interaction. Close it manually when done.'
        );
      }

      return data;
    } catch (error) {
      this.logger.error(error);

      if (headlessFlag) {
        await this.puppeteerUtilsService.cleanup(browser, page, recorder);
      } else {
        await this.puppeteerUtilsService.stopRecorder(recorder);
        this.logger.log(
          'Headful mode detected and an error occurred: skipping automatic cleanup so the browser remains open for debugging.'
        );
      }

      // The batch shows this message: the reason, without a stack trace or
      // a file path.
      throw new HttpException(
        toClientErrorMessage(error) || 'Failed to run the test',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Aborts the run in progress, which closes its browser, and drops the runs
   * queued behind it.
   */
  abort() {
    this.runQueue.stop();
  }
}
