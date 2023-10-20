import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { ActionService } from './action/action.service';
import { WebMonitoringService } from './web-monitoring/web-monitoring.service';
import { SharedService } from '../shared/shared.service';
import { Browser, Credentials, Page } from 'puppeteer';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import path from 'path';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';

@Injectable()
export class WebAgentService {
  constructor(
    private readonly puppeteerService: PuppeteerService,
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
    const browser = await this.puppeteerService.initAndReturnBrowser({
      headless: 'new',
    });
    const page = await this.puppeteerService.navigateTo(
      url,
      browser,
      credentials
    );
    // const result = await this.dataLayerService.getDataLayer(page);
    const result = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(window.dataLayer)); // Serialize the dataLayer object to ensure compatibility.
    });
    await browser.close();
    return result;
  }

  async getGtmTestingPage(gtmUrl: string, browser: Browser) {
    return this.puppeteerService.navigateTo(gtmUrl, browser);
  }

  async getCurrentBrowser(args?: string[], headless?: string) {
    return await this.puppeteerService.initAndReturnBrowser({
      headless: headless.toLowerCase() === 'new' ? 'new' : false || false,
      args: args,
    });
  }

  getGcs(requests: string[]) {
    return this.webMonitoringService.getGcs(requests);
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
      await this.puppeteerService.httpAuth(page, credentials);
    }

    let eventRequest: string = null;

    // 2) perform the test operation
    try {
      await this.actionService.performOperation(page, projectName, operation);

      await page.waitForFunction(
        () =>
          Object.prototype.hasOwnProperty.call(window, 'dataLayer') &&
          Array.isArray(window.dataLayer) &&
          window.dataLayer.length > 0,
        { timeout: 3000 }
      );

      const dataLayer = await page.evaluate(() => {
        return window.dataLayer;
      });

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
      try {
        await this.puppeteerService.snapshot(
          page,
          path.join(imageSavingFolder, `${testName}.png`),
          true
        );
      } catch (error) {
        Logger.error('screenshot failed'); // Log the actual error message for debugging.
      }

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
