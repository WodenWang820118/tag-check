import { HttpException, Injectable } from '@nestjs/common';
import { ActionService } from './action/action.service';
import { WebMonitoringService } from './web-monitoring/web-monitoring.service';
import { SharedService } from '../shared/shared.service';
import puppeteer, { Credentials, Page } from 'puppeteer';
import { FilePathOptions } from '../shared/interfaces/file-path-options.interface';
import path from 'path';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';

@Injectable()
export class WebAgentService {
  constructor(
    private readonly actionService: ActionService,
    private readonly webMonitoringService: WebMonitoringService,
    private readonly dataLayerService: DataLayerService,
    private readonly sharedService: SharedService
  ) {}

  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    testName: string,
    path?: string,
    credentials?: Credentials
  ) {
    const { dataLayer, destinationUrl } = await this.performTest(
      page,
      projectName,
      testName,
      path,
      false,
      null,
      credentials
    );
    return {
      dataLayer,
      destinationUrl,
    };
  }

  async fetchDataLayer(url: string, credentials?: Credentials) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [''],
    });
    const [page] = await browser.pages();
    if (credentials) {
      await page.authenticate({
        username: credentials.username,
        password: credentials.password,
      });
    }
    await page.goto(url);
    const result = await this.dataLayerService.getDataLayer(page);
    await browser.close();
    return result;
  }

  async executeAndGetDataLayerAndRequest(
    page: Page,
    projectName: string,
    testName: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    const { dataLayer, eventRequest, destinationUrl } = await this.performTest(
      page,
      projectName,
      testName,
      path,
      true,
      measurementId,
      credentials
    );
    return {
      dataLayer,
      eventRequest,
      destinationUrl,
    };
  }

  private async performTest(
    page: Page,
    projectName: string,
    testName: string,
    filePath?: string,
    captureRequest = false,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 1) gather all necessary data and initialize the test
    this.webMonitoringService.initEventFolder(projectName, testName);
    this.dataLayerService.initSelfDataLayer(projectName, testName);

    const operationOption: FilePathOptions = {
      name: testName,
      absolutePath: filePath,
    };

    const operation = this.sharedService.getOperationJson(
      projectName,
      operationOption
    );

    if (credentials) {
      await page.authenticate({
        username: credentials.username,
        password: credentials.password,
      });
    }

    let eventRequest: string = null;

    // 2) perform the test operation
    try {
      await this.actionService.performOperation(page, projectName, operation);
      const dataLayer = this.dataLayerService.getMyDataLayer(
        projectName,
        testName
      );
      const destinationUrl = page.url();

      if (captureRequest) {
        const request = await page.waitForRequest(
          (request) =>
            request.url().includes(`en=${testName}`) &&
            request.url().includes(`tid=${measurementId}`)
        );
        eventRequest = request.url();
      }

      // 3) save screenshots/videos
      // TODO: temporary solution, it could be better in different stages of the workflow
      const imageSavingFolder = path.join(
        this.sharedService.getReportSavingFolder(projectName),
        testName
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const screenshotPath = path.join(imageSavingFolder, `${testName}.png`);

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // 4) close the page
      await page.close();

      return {
        dataLayer,
        eventRequest,
        destinationUrl,
      };
    } catch (error) {
      await page.close();
      throw new HttpException(
        `An error occurred while performing the test: ${error}`,
        500
      );
    }
  }
}
