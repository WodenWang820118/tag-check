import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  BaseDataLayerEvent,
  ValidationResult,
} from '@utils';
import { FileService } from '../os/file/file.service';
import { FilePathService } from '../os/path/file-path/file-path.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { RequestProcessorService } from '../request-processor/request-processor.service';
import { Credentials, Page } from 'puppeteer';
import { InspectorUtilsService } from './inspector-utils.service';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';

@Injectable()
export class InspectorSingleEventService {
  constructor(
    private webAgentService: WebAgentService,
    private fileService: FileService,
    private requestProcessorService: RequestProcessorService,
    private filePathService: FilePathService,
    private inspectorUtilsService: InspectorUtilsService
  ) {}

  // inspect one event
  async inspectDataLayer(
    page: Page,
    projectName: string,
    testName: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
  ) {
    try {
      // 1. Get the project spec from the local file system
      const specsPath = await this.filePathService.getProjectConfigFilePath(
        projectName
      );
      const specs = await this.fileService.readJsonFile(specsPath);
      const imageSavingFolder = await this.filePathService.getImageFilePath(
        projectName,
        testName
      );

      // Logger.log(specs, 'inspector.inspectDataLayer');
      // expectedObj is the spec to be compared with the result
      const expectedObj = specs.find(
        (spec: BaseDataLayerEvent) => spec.event === testName
      );

      // 2. Execute the recording script and get the result
      // switch the measurementId to determine whether to grab requests

      switch (measurementId) {
        case undefined: {
          const result = await this.webAgentService.executeAndGetDataLayer(
            page,
            projectName,
            testName,
            credentials,
            application
          );

          // 3. Compare the result with the project spec
          // 3.1 Get the corresponding event object from the result
          // 3.2 Compare the expectedObj with the result, applying strategies
          const dataLayerResult = this.inspectorUtilsService.isDataLayerCorrect(
            result.dataLayer,
            expectedObj
          );

          Logger.log(dataLayerResult, 'inspector.inspectDataLayer');

          const destinationUrl = result.destinationUrl;
          Logger.log(destinationUrl, 'inspector.inspectDataLayer');
          await this.fileService.writeCacheFile(projectName, testName, result);
          await page.screenshot({
            path: imageSavingFolder,
          });

          if (headless === 'true') await page.close();
          Logger.log('Browser is closed!', 'inspector.inspectDataLayer');
          return {
            dataLayerResult,
            destinationUrl,
            rawRequest: '',
            requestCheckResult: '' as unknown as ValidationResult,
          };
        }
        default: {
          const result =
            await this.webAgentService.executeAndGetDataLayerAndRequest(
              page,
              projectName,
              testName,
              measurementId,
              credentials,
              application
            );

          // 3. Compare the result with the project spec
          // 3.1 Get the corresponding event object from the result
          // 3.2 Compare the expectedObj with the result, applying strategies
          const dataLayerResult = this.inspectorUtilsService.isDataLayerCorrect(
            result.dataLayer,
            expectedObj
          );

          const rawRequest = result.eventRequest;

          // TODO: Continue to test the request
          const recomposedRequest =
            this.requestProcessorService.recomposeGA4ECEvent(
              result.eventRequest
            );

          const requestCheckResult =
            this.inspectorUtilsService.isDataLayerCorrect(
              [recomposedRequest],
              expectedObj
            );

          const destinationUrl = result.destinationUrl;
          await this.fileService.writeCacheFile(projectName, testName, result);
          await page.screenshot({
            path: imageSavingFolder,
          });

          if (headless === 'true') await page.close();

          return {
            dataLayerResult,
            destinationUrl,
            rawRequest,
            requestCheckResult,
          };
        }
      }
    } catch (error) {
      Logger.error(error.message, 'inspector.inspectDataLayer');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
