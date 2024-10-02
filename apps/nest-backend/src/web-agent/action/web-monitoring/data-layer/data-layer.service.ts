/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { Page } from 'puppeteer';
import { FolderPathService } from '../../../../os/path/folder-path/folder-path.service';
import { extractEventNameFromId } from '@utils';
import { FileService } from '../../../../os/file/file.service';
import { FilePathService } from '../../../../os/path/file-path/file-path.service';
@Injectable()
export class DataLayerService {
  private readonly logger = new Logger(DataLayerService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService
  ) {}

  async initSelfDataLayer(projectName: string, eventId: string) {
    const resultFolder = await this.folderPathService.getReportSavingFolderPath(
      projectName
    );
    const eventName = extractEventNameFromId(eventId);
    const filePath = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );
    this.fileService.writeJsonFile(filePath, []);
  }

  async updateSelfDataLayer(page: Page, projectName: string, eventId: string) {
    try {
      await page.waitForFunction(
        () =>
          Object.prototype.hasOwnProperty.call(window, 'dataLayer') &&
          Array.isArray(window.dataLayer) &&
          window.dataLayer.length > 0,
        { timeout: 2000 }
      );

      const dataLayer: any[] = await page.evaluate(() => {
        return window.dataLayer
          ? JSON.parse(JSON.stringify(window.dataLayer))
          : [{ event: 'no data layer' }];
      });
      await this.updateSelfDataLayerAlgorithm(dataLayer, projectName, eventId);
    } catch (error) {
      this.logger.error(`Failed to update self data layer: ${error}`);
    }
  }

  async updateSelfDataLayerAlgorithm(
    dataLayer: any[],
    projectName: string,
    eventId: string
  ) {
    if (!dataLayer || dataLayer.length === 0) return;
    const resultFolder = await this.folderPathService.getReportSavingFolderPath(
      projectName
    );
    const eventName = extractEventNameFromId(eventId);
    const myDataLayerFile = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );

    // Ensure to read the file content before trying to parse it as JSON
    const myDataLayer: any[] = this.fileService.readJsonFile(myDataLayerFile);

    dataLayer.forEach((dataLayerObject) => {
      const existingIndex = myDataLayer.findIndex(
        (myDataLayerObject: { event: any }) => {
          return myDataLayerObject.event === dataLayerObject.event;
        }
      );

      if (existingIndex === -1) {
        myDataLayer.push(dataLayerObject);
      } else {
        myDataLayer[existingIndex] = dataLayerObject;
      }
    });

    this.fileService.writeJsonFile(myDataLayerFile, myDataLayer);
  }

  async getMyDataLayer(projectSlug: string, eventId: string) {
    const myDataLayerFile = await this.filePathService.getMyDataLayerFilePath(
      projectSlug,
      eventId
    );

    const myDataLayer = this.fileService.readJsonFile<any>(myDataLayerFile);
    return myDataLayer;
  }
}
