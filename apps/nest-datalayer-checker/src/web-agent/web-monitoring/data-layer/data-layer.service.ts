import { HttpException, Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { SharedService } from '../../../shared/shared.service';
import { Page } from 'puppeteer';

@Injectable()
export class DataLayerService {
  constructor(private sharedService: SharedService) {}

  initSelfDataLayer(projectName: string, testName: string) {
    const resultFolder = this.sharedService.getReportSavingFolder(projectName);
    const filePath = path.join(
      resultFolder,
      testName,
      `${testName} - myDataLayer.json`
    );
    writeFileSync(filePath, '[]');
  }

  async getDataLayer(page: Page, timeout = 5000) {
    await page.waitForFunction(
      () => typeof window.dataLayer !== 'undefined',
      { timeout: timeout } // timeout here to fail fast if needed
    );
    try {
      return await page.evaluate(() => {
        return window.dataLayer;
      });
    } catch (error) {
      throw new HttpException(
        'DataLayer is empty or undefined',
        error.status || 500
      );
    }
  }

  async updateSelfDataLayer(page: Page, projectName: string, testName: string) {
    const dataLayer = await this.getDataLayer(page);
    this.updateSelfDataLayerAlgorithm(dataLayer, projectName, testName);
  }

  updateSelfDataLayerAlgorithm(
    dataLayer: any[],
    projectName: string,
    testName: string
  ) {
    const resultFolder = this.sharedService.getReportSavingFolder(projectName);
    const myDataLayerFile = path.join(
      resultFolder,
      testName,
      `${testName} - myDataLayer.json`
    );

    // Ensure to read the file content before trying to parse it as JSON
    const myDataLayerContent = readFileSync(myDataLayerFile, 'utf8');
    const myDataLayer = JSON.parse(myDataLayerContent);

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
  }

  getMyDataLayer(projectName: string, testName: string) {
    const resultFolder = this.sharedService.getReportSavingFolder(projectName);
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
