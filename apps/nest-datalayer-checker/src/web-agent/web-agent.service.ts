import { HttpException, Injectable } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { ActionService } from './action/action.service';
import { WebMonitoringService } from './web-monitoring/web-monitoring.service';
import { SharedService } from '../shared/shared.service';
import { Browser, Credentials } from 'puppeteer';
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
    projectName: string,
    testName: string,
    args: string[],
    headless: string,
    path?: string,
    credentials?: Credentials
  ) {
    const headlessBool = headless === 'new' ? 'new' : false;
    const { dataLayer, destinationUrl } = await this.performTest(
      projectName,
      testName,
      args,
      headlessBool,
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
      throw new HttpException(
        'An error occurred while executing and getting the data layer: ' +
          error,
        500
      );
    }
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
    const result = await this.dataLayerService.getDataLayer(page);
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
    projectName: string,
    testName: string,
    args: string[],
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    const headlessBool = headless === 'new' ? 'new' : false;
    const { dataLayer, eventRequest, destinationUrl } = await this.performTest(
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
      destinationUrl,
    };
  }

  private async performTest(
    projectName: string,
    testName: string,
    args: string[],
    headless: 'new' | boolean,
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

    const browser = await this.puppeteerService.initAndReturnBrowser({
      headless: headless,
      args: args,
    });

    const [page] = await browser.pages();

    if (credentials) {
      await this.puppeteerService.httpAuth(page, credentials);
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
      await this.puppeteerService.snapshot(
        page,
        path.join(imageSavingFolder, `${testName}.png`),
        true
      );

      // 4) close the browser
      await page.close();
      await browser.close();

      return {
        dataLayer,
        eventRequest,
        destinationUrl,
      };
    } catch (error) {
      await browser?.close();
      throw new HttpException(
        `An error occurred while performing the test: ${error}`,
        500
      );
    }
  }
  // TODO: will need to implement one browser for multiple tab tests
}
