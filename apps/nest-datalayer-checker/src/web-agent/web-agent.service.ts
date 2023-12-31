import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ActionService } from './action/action.service';
import { WebMonitoringService } from './web-monitoring/web-monitoring.service';
import puppeteer, { Credentials, Page } from 'puppeteer';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';
import { FileService } from '../shared/file/file.service';
@Injectable()
export class WebAgentService {
  constructor(
    private readonly actionService: ActionService,
    private readonly webMonitoringService: WebMonitoringService,
    private readonly dataLayerService: DataLayerService,
    private readonly fileService: FileService
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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const [page] = await browser.pages();

    if (credentials) {
      await page.authenticate({
        username: credentials.username,
        password: credentials.password,
      });
    }
    await page.goto(url, { waitUntil: 'networkidle2' });

    // const result = await this.dataLayerService.getDataLayer(page);
    const result = await page.evaluate(() => {
      return window.dataLayer
        ? JSON.parse(JSON.stringify(window.dataLayer))
        : [];
    });

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

  async performTest(
    page: Page,
    projectName: string,
    testName: string,
    filePath?: string,
    captureRequest = false,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 1) gather all necessary data and initialize the test
    await this.webMonitoringService.initEventFolder(projectName, testName);
    await this.dataLayerService.initSelfDataLayer(projectName, testName);

    const operationOption: FilePathOptions = {
      name: testName,
      absolutePath: filePath,
    };

    const operation = await this.fileService.getOperationJson(
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
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 10000,
        });
      } catch (error) {
        Logger.log('no navigation needed', 'WebAgent.performTest');
      }
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        testName
      );
      const dataLayer = await this.webMonitoringService.getMyDataLayer(
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

      return {
        dataLayer,
        eventRequest,
        destinationUrl,
      };
    } catch (error) {
      await page.close();
      Logger.error(error.message, 'WebAgent.performTest');
      throw new HttpException(error.message, 500);
    }
  }
}
