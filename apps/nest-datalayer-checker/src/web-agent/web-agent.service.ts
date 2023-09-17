import { Injectable } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { ActionService } from './action/action.service';
import { WebMonitoringService } from './web-monitoring/web-monitoring.service';
import { SharedService } from '../shared-module/shared-service.service';
import { Browser, Credentials } from 'puppeteer';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';

@Injectable()
export class WebAgentService {
  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly actionService: ActionService,
    private readonly webMonitoringService: WebMonitoringService,
    private readonly sharedService: SharedService
  ) {}

  async executeAndGetDataLayer(
    projectName: string,
    testName: string,
    args: string[],
    headless: string,
    path?: string,
    credentials?: Credentials
  ) {
    const headlessBool = headless === 'true' ? true : false;
    const { dataLayer } = await this.performTest(
      projectName,
      testName,
      args,
      headlessBool,
      path,
      false,
      null,
      credentials
    );
    return dataLayer;
  }

  async executeAndGetDataLayerByProject(
    projectName: string,
    args: string[],
    headless: string,
    path: string,
    credentials?: Credentials
  ) {
    try {
      const specOption: FilePathOptions = {
        name: projectName,
        absolutePath: path,
      };

      const operations =
        this.sharedService.getOperationJsonByProject(specOption);
      const dataLayers = [];

      for (const operation of operations) {
        const dataLayer = await this.executeAndGetDataLayer(
          projectName,
          operation,
          args,
          headless,
          path,
          credentials
        );
        dataLayers.push(dataLayer);
      }
      return dataLayers;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async fetchDataLayer(url: string, credentials?: Credentials) {
    const browser = await this.puppeteerService.initAndReturnBrowser({
      headless: true,
    });
    const page = await this.puppeteerService.navigateTo(
      url,
      browser,
      credentials
    );
    const result = await this.webMonitoringService.getDataLayer(page);
    await browser.close();
    return result;
  }

  async getGtmTestingPage(gtmUrl: string, browser: Browser) {
    return this.puppeteerService.navigateTo(gtmUrl, browser);
  }

  async getCurrentBrowser(args?: string[], headless?: string) {
    return await this.puppeteerService.initAndReturnBrowser({
      headless: headless.toLowerCase() === 'true' ? true : false || false,
      args: args,
    });
  }

  getGcs(requests: string[]) {
    return this.webMonitoringService.getGcs(requests);
  }

  async executeAndGetDataLayerAndRequest(
    projectName: string,
    testName: string,
    args: string[],
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    const headlessBool = headless === 'true' ? true : false;
    const { dataLayer, eventRequest } = await this.performTest(
      projectName,
      testName,
      args,
      headlessBool,
      path,
      true,
      measurementId,
      credentials
    );
    return {
      dataLayer,
      eventRequest,
    };
  }

  private async performTest(
    projectName: string,
    testName: string,
    args: string[],
    headless: boolean,
    path?: string,
    captureRequest = false,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 1) gather all necessary data
    const operationOption: FilePathOptions = {
      name: testName,
      absolutePath: path,
    };

    const operation = this.sharedService.getOperationJson(
      projectName,
      operationOption
    );

    const browser = await this.puppeteerService.initAndReturnBrowser({
      headless: headless,
      args: args,
    });

    await this.puppeteerService.navigateTo(
      operation.steps[1].url,
      browser,
      credentials
    );

    const pages = await browser.pages();
    const page = pages[pages.length - 1];

    let eventRequest: string = null;

    // 2) perform the test operation
    try {
      await this.actionService.performOperation(page, operation);
      const dataLayer = await this.webMonitoringService.getDataLayer(page);

      if (captureRequest) {
        const request = await page.waitForRequest(
          (request) =>
            request.url().includes(`en=${testName}`) &&
            request.url().includes(`tid=${measurementId}`)
        );
        eventRequest = request.url();
      }

      await browser.close();

      return {
        dataLayer,
        eventRequest,
      };
    } catch (error) {
      console.error(`Error in performTest: ${error}`);
      await browser?.close();
      throw error;
    }
  }
}
