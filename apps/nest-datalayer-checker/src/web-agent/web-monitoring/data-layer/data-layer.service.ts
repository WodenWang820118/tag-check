import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { FileService } from '../../../shared/file/file.service';

@Injectable()
export class DataLayerService {
  constructor(private fileService: FileService) {}

  initSelfDataLayer(projectName: string, testName: string) {
    const resultFolder = this.fileService.getReportSavingFolder(projectName);
    const filePath = path.join(
      resultFolder,
      testName,
      `${testName} - myDataLayer.json`
    );
    writeFileSync(filePath, '[]');
  }

  async updateSelfDataLayer(page: Page, projectName: string, testName: string) {
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
      this.updateSelfDataLayerAlgorithm(dataLayer, projectName, testName);
    } catch (error) {
      Logger.error(error.message, 'DataLayerService.updateSelfDataLayer'); // Log the actual error message for debugging.
    }
  }

  updateSelfDataLayerAlgorithm(
    dataLayer: any[],
    projectName: string,
    testName: string
  ) {
    if (!dataLayer || dataLayer.length === 0) return;
    const resultFolder = this.fileService.getReportSavingFolder(projectName);
    const myDataLayerFile = path.join(
      resultFolder,
      testName,
      `${testName} - myDataLayer.json`
    );

    // Ensure to read the file content before trying to parse it as JSON
    const myDataLayerContent = readFileSync(myDataLayerFile, 'utf8');
    const myDataLayer = JSON.parse(myDataLayerContent);

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

      writeFileSync(myDataLayerFile, JSON.stringify(myDataLayer, null, 2));
    } catch (error) {
      Logger.error(`Error while updating self data layer: ${error.message}`);
    }
  }

  getMyDataLayer(projectName: string, testName: string) {
    const resultFolder = this.fileService.getReportSavingFolder(projectName);
    const myDataLayerFile = path.join(
      resultFolder,
      testName,
      `${testName} - myDataLayer.json`
    );
    const myDataLayerContent = readFileSync(myDataLayerFile, 'utf8');
    const myDataLayer = JSON.parse(myDataLayerContent);
    return myDataLayer;
  }
}
