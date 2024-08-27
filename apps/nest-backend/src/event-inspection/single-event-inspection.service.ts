import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials, Page } from 'puppeteer';
import { EventInspectionPresetDto } from '@utils';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { BROWSER_ARGS } from '../configs/project.config';
@Injectable()
export class SingleEventInspectionService {
  constructor(
    private eventInspectionPipelineService: EventInspectionPipelineService
  ) {}
  private abortController: AbortController | null = null;
  private currentBrowser: Browser | null = null;
  private currentPage: Page | null = null;

  async inspectSingleEvent(
    projectName: string,
    eventId: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    try {
      this.currentBrowser = await stats.puppeteer.launch({
        headless: headless === 'true' ? true : false,
        defaultViewport: null,
        devtools: measurementId ? true : false,
        ignoreHTTPSErrors: true,
        args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
        executablePath: stats.executablePath,
        signal: signal,
      });
      Logger.log(
        'Browser launched',
        `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.inspectSingleEvent.name}`
      );

      this.currentPage = (await this.currentBrowser.pages())[0];

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
        eventId,
        headless,
        measurementId,
        credentials,
        eventInspectionPresetDto
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        Logger.error(
          'Operation was aborted',
          `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.inspectSingleEvent.name}`
        );
      } else {
        Logger.error(
          error,
          `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.inspectSingleEvent.name}`
        );
      }
      await this.cleanup();
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  stopOperation() {
    Logger.log(
      'Operation stopped',
      `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.stopOperation.name}`
    );
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async cleanup() {
    Logger.log(
      'Cleaning up resources',
      `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.stopOperation.name}`
    );
    if (this.currentPage) {
      await this.currentPage
        .close()
        .catch((err) =>
          Logger.error(
            'Error closing page' + err,
            `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.stopOperation.name}`
          )
        );
      this.currentPage = null;
    }
    if (this.currentBrowser) {
      await this.currentBrowser
        .close()
        .catch((err) =>
          Logger.error(
            'Error closing browser' + err,
            `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.stopOperation.name}`
          )
        );
      this.currentBrowser = null;
    }
  }
}
