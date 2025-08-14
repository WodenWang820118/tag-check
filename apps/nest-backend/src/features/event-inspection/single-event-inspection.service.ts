import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { CookieData, Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '@utils';
import { EventInspectionPipelineService } from '../../features/event-inspection-pipeline/event-inspection-pipeline.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { PuppeteerUtilsService } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';

export interface InspectSingleEventOptions {
  headless: string;
  measurementId: string;
  credentials: Credentials;
  captureRequest: string;
  url: string;
  eventInspectionPresetDto: EventInspectionPresetDto;
}

@Injectable()
export class SingleEventInspectionService {
  private readonly logger = new Logger(SingleEventInspectionService.name);
  abortController: AbortController | null = null;

  constructor(
    private readonly eventInspectionPipelineService: EventInspectionPipelineService,
    private readonly folderPathService: FolderPathService,
    private readonly puppeteerUtilsService: PuppeteerUtilsService
  ) {}

  initializeAbortController() {
    this.abortController = new AbortController();
  }

  async inspectSingleEvent(
    projectSlug: string,
    eventId: string,
    options: InspectSingleEventOptions
  ) {
    this.initializeAbortController();
    if (!this.abortController) {
      throw new InternalServerErrorException(
        'Abort controller is not initialized'
      );
    }

    const {
      headless,
      measurementId,
      credentials,
      captureRequest,
      url,
      eventInspectionPresetDto
    } = options;
    const { browser, page } = await this.puppeteerUtilsService.startBrowser(
      headless,
      measurementId,
      eventInspectionPresetDto,
      this.abortController.signal
    );

    // extract cookie setting logic to helper
    await this.applyCookies(browser, url, eventInspectionPresetDto);

    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );

    const recorder = await this.puppeteerUtilsService.startRecorder(
      page,
      folder
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
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
      await recorder.stop();
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
      await browser.close();
      return data;
    } catch (error) {
      this.logger.error(error);
      await this.puppeteerUtilsService.cleanup(browser, page);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // helper to apply cookies from preset
  private async applyCookies(
    browser: import('puppeteer').Browser,
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
