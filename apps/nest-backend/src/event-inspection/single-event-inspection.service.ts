/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '@utils';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { FolderPathService } from '../infrastructure/os/path/folder-path/folder-path.service';
import { PuppeteerUtilsService } from '../web-agent/puppeteer-utils/puppeteer-utils.service';

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
          headless,
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
}
