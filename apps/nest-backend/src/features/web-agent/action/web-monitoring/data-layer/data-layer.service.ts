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
        () => {
          const g = globalThis as unknown as { dataLayer?: unknown[] };
          return (
            Object.hasOwn(g, 'dataLayer') &&
            Array.isArray(g.dataLayer) &&
            (g.dataLayer?.length ?? 0) > 0
          );
        },
        { timeout: 5000 }
      );

      const dataLayer: unknown[] = await page.evaluate(() => {
        // give a minimal typed shape to avoid `any` lint errors inside the evaluate sandbox
        const g = globalThis as unknown as { dataLayer?: unknown[] };
        return g.dataLayer
          ? structuredClone(g.dataLayer)
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
      this.fileService.readJsonFile<unknown[]>(myDataLayerFile) || [];

    for (const dataLayerObject of dataLayer) {
      const existingIndex = myDataLayer.findIndex((myDataLayerObject) => {
        // loosely compare by event property if present
        try {
          const left = (
            myDataLayerObject as Record<string, unknown> | undefined
          )?.['event'];
          const right = (
            dataLayerObject as Record<string, unknown> | undefined
          )?.['event'];
          return left === right;
        } catch {
          return false;
        }
      });

      if (existingIndex === -1) {
        myDataLayer.push(dataLayerObject);
      } else {
        myDataLayer[existingIndex] = dataLayerObject;
      }
    }

    this.fileService.writeJsonFile(myDataLayerFile, myDataLayer);
  }

  async getMyDataLayer(projectSlug: string, eventId: string) {
    const myDataLayerFile = await this.filePathService.getMyDataLayerFilePath(
      projectSlug,
      eventId
    );

    const myDataLayer =
      this.fileService.readJsonFile<unknown[]>(myDataLayerFile) || [];
    return myDataLayer;
  }
}
