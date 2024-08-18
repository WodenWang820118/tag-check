import { Injectable, Logger } from '@nestjs/common';
import path from 'path';
import { Page } from 'puppeteer';
import { FolderPathService } from '../../../os/path/folder-path/folder-path.service';
import { extractEventNameFromId } from '@utils';
import { FileService } from '../../../os/file/file.service';
import { FilePathService } from '../../../os/path/file-path/file-path.service';
@Injectable()
export class DataLayerService {
  constructor(
    private folderPathService: FolderPathService,
    private fileService: FileService,
    private filePathService: FilePathService
  ) {}

  async initSelfDataLayer(projectName: string, eventId: string) {
    const resultFolder = await this.folderPathService.getReportSavingFolderPath(
      projectName
    );
    const eventName = extractEventNameFromId(eventId);
    const filePath = path.join(
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
      Logger.error(
        error,
        `${DataLayerService.name}.${DataLayerService.prototype.updateSelfDataLayer.name}`
      ); // Log the actual error message for debugging.
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
    const myDataLayerFile = path.join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );

    // Ensure to read the file content before trying to parse it as JSON
    const myDataLayer = this.fileService.readJsonFile(myDataLayerFile);

    try {
      dataLayer.forEach((dataLayerObject) => {
        const existingIndex = myDataLayer.findIndex((myDataLayerObject) => {
          return myDataLayerObject.event === dataLayerObject.event;
        });

        if (existingIndex === -1) {
          myDataLayer.push(dataLayerObject);
        } else {
          myDataLayer[existingIndex] = dataLayerObject;
        }
      });

      this.fileService.writeJsonFile(myDataLayerFile, myDataLayer);
    } catch (error) {
      Logger.error(
        error,
        `${DataLayerService.name}.${DataLayerService.prototype.updateSelfDataLayerAlgorithm.name}`
      ); // Log the actual error message for debugging.
    }
  }

  async getMyDataLayer(projectSlug: string, eventId: string) {
    const myDataLayerFile = await this.filePathService.getMyDataLayerFilePath(
      projectSlug,
      eventId
    );

    const myDataLayer = this.fileService.readJsonFile(myDataLayerFile);
    return myDataLayer;
  }
}
