import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../os/file/file.service';
import { FilePathService } from '../os/path/file-path/file-path.service';
import { ProjectInitializationService } from '../os/project-initialization/project-initialization.service';
import { ActionService } from './action/action.service';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';
import { Page, Credentials } from 'puppeteer';

@Injectable()
export class WebAgentUtilsService {
  constructor(
    private actionService: ActionService,
    private dataLayerService: DataLayerService,
    private fileService: FileService,
    private filePathService: FilePathService,
    private projectInitializationService: ProjectInitializationService
  ) {}

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
    await this.projectInitializationService.initInspectionEventSavingFolder(
      projectName,
      testName
    );
    await this.dataLayerService.initSelfDataLayer(projectName, testName);

    const operation = await this.fileService.readJsonFile(
      await this.filePathService.getOperationFilePath(projectName, testName)
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
        Logger.log('no navigation needed', 'WebAgentUtils.performTest');
      }
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        testName
      );
      const dataLayer = await this.dataLayerService.getMyDataLayer(
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
