import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '@utils';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { FolderPathService } from '../os/path/folder-path/folder-path.service';
import { PuppeteerUtilsService } from '../web-agent/puppeteer-utils/puppeteer-utils.service';

@Injectable()
export class SingleEventInspectionService {
  constructor(
    private eventInspectionPipelineService: EventInspectionPipelineService,
    private folderPathService: FolderPathService,
    private puppeteerUtilsService: PuppeteerUtilsService
  ) {}

  async inspectSingleEvent(
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

    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );

    await this.puppeteerUtilsService.startRecorder(page, folder);
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
          eventInspectionPresetDto
        );

      await browser.close();
      return data;
    } catch (error) {
      Logger.error(
        error,
        `${SingleEventInspectionService.name}.${SingleEventInspectionService.prototype.inspectSingleEvent.name}`
      );
      await this.puppeteerUtilsService.cleanup(browser, page);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
