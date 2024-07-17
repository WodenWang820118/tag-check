import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  BaseDataLayerEvent,
  extractEventNameFromId,
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
    eventId: string,
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
        eventId
      );

      // expectedObj is the spec to be compared with the result
      // extact the event name from the event id
      // e.g. 'page_view_1234-5678-1234-5678-1234-5678' => 'page_view'
      const eventName = extractEventNameFromId(eventId);

      const expectedObj = specs.find(
        (spec: BaseDataLayerEvent) => spec.event === eventName
      );

      // 2. Execute the recording script and get the result
      // switch the measurementId to determine whether to grab requests

      switch (measurementId) {
        case undefined: {
          const result = await this.webAgentService.executeAndGetDataLayer(
            page,
            projectName,
            eventId,
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

          Logger.log(
            dataLayerResult,
            'InspectorSingleEventService.inspectDataLayer'
          );

          const destinationUrl = result.destinationUrl;
          Logger.log(
            destinationUrl,
            'InspectorSingleEventService.inspectDataLayer'
          );
          await this.fileService.writeCacheFile(projectName, eventId, result);
          await page.screenshot({
            path: imageSavingFolder,
          });

          if (headless === 'true') await page.close();
          Logger.log(
            'Browser is closed!',
            'InspectorSingleEventService.inspectDataLayer'
          );
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
              eventId,
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
          await this.fileService.writeCacheFile(projectName, eventId, result);
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
      Logger.error(
        error.message,
        'InspectorSingleEventService.inspectDataLayer'
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
