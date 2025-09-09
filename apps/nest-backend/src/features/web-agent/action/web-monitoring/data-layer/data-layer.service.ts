import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { Page } from 'puppeteer';
import { FolderPathService } from '../../../../../infrastructure/os/path/folder-path/folder-path.service';
import { extractEventNameFromId } from '@utils';
import { FileService } from '../../../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../../../infrastructure/os/path/file-path/file-path.service';
@Injectable()
export class DataLayerService {
  private readonly logger = new Logger(DataLayerService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService
  ) {}

  async initSelfDataLayer(projectName: string, eventId: string) {
    const resultFolder =
      await this.folderPathService.getReportSavingFolderPath(projectName);
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
          Object.hasOwn(window, 'dataLayer') &&
          Array.isArray(window.dataLayer) &&
          window.dataLayer.length > 0,
        { timeout: 5000 }
      );

      const dataLayer: unknown[] = await page.evaluate(() => {
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
    dataLayer: unknown[],
    projectName: string,
    eventId: string
  ) {
    if (!dataLayer || dataLayer.length === 0) return;
    const resultFolder =
      await this.folderPathService.getReportSavingFolderPath(projectName);
    const eventName = extractEventNameFromId(eventId);
    const myDataLayerFile = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );

    // Ensure to read the file content before trying to parse it as JSON
    const myDataLayer: unknown[] =
      this.fileService.readJsonFile(myDataLayerFile);

    dataLayer.forEach((dataLayerObject) => {
      const existingIndex = myDataLayer.findIndex((myDataLayerObject: any) => {
        // loosely compare by event property if present
        try {
           
          return (
            myDataLayerObject &&
            (myDataLayerObject as any).event === (dataLayerObject as any).event
          );
        } catch {
          return false;
        }
      });

      if (existingIndex === -1) {
        (myDataLayer as unknown[]).push(dataLayerObject);
      } else {
        (myDataLayer as unknown[])[existingIndex] = dataLayerObject;
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
