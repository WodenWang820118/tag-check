import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../os/file/file.service';
import { FilePathService } from '../os/path/file-path/file-path.service';
import { ProjectInitializationService } from '../os/project-initialization/project-initialization.service';
import { ActionService } from './action/action.service';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';
import { Page, Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';

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
    captureRequest?: boolean,
    measurementId?: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
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

    // 2) capture the request if needed
    if (captureRequest) {
      Logger.log('capturing request', 'WebAgentUtils.performTest');
      page.on('request', (interceptedRequest) => {
        if (
          interceptedRequest.url().includes(`en=${testName}`) &&
          interceptedRequest.url().includes(`tid=${measurementId}`)
        ) {
          Logger.log(
            interceptedRequest.url(),
            'WebAgentUtils.performTest: request captured'
          );
          eventRequest = interceptedRequest.url();
          page.off('request');
        } else {
          Logger.log(
            interceptedRequest.url(),
            'WebAgentUtils.performTest: monitoring request'
          );
        }
      });
    }

    // 3) perform the test operation
    try {
      await this.actionService.performOperation(
        page,
        projectName,
        operation,
        application
      );
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

      Logger.log('test completed', 'WebAgentUtils.performTest');
      return {
        dataLayer,
        eventRequest,
        destinationUrl,
      };
    } catch (error) {
      Logger.error(error.message, 'WebAgent.performTest');
      throw new HttpException(error.message, 500);
    }
  }
}
