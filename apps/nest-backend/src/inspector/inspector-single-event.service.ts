/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
    projectSlug: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application']
  ) {
    try {
      // 1. Get the project spec from the local file system
      const specsPath = await this.filePathService.getProjectConfigFilePath(
        projectSlug
      );
      const specs = this.fileService.readJsonFile<any>(specsPath);
      const imageSavingFolder = await this.filePathService.getImageFilePath(
        projectSlug,
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

      switch (captureRequest) {
        case 'false': {
          Logger.log(
            `MeasurementId is empty`,
            `${InspectorSingleEventService.name}.${InspectorSingleEventService.prototype.inspectDataLayer.name}`
          );
          const result = await this.webAgentService.executeAndGetDataLayer(
            page,
            projectSlug,
            eventId,
            measurementId,
            credentials,
            captureRequest,
            application
          );

          // 3. Compare the result with the project spec
          // 3.1 Get the corresponding event object from the result
          // 3.2 Compare the expectedObj with the result, applying strategies
          const dataLayerResult = this.inspectorUtilsService.isDataLayerCorrect(
            result.dataLayer,
            expectedObj
          );

          const destinationUrl = result.destinationUrl;
          Logger.log(
            destinationUrl,
            `${InspectorSingleEventService.name}.${InspectorSingleEventService.prototype.inspectDataLayer.name}`
          );
          await this.fileService.writeCacheFile(projectSlug, eventId, result);
          await page.screenshot({
            path: imageSavingFolder,
            fullPage: true,
          });
          // allow the screencast video to be finalized
          await new Promise((resolve) => setTimeout(resolve, 5000));
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
              projectSlug,
              eventId,
              measurementId,
              credentials,
              captureRequest,
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
          await this.fileService.writeCacheFile(projectSlug, eventId, result);
          await page.screenshot({
            path: imageSavingFolder,
            fullPage: true,
          });
          // allow the screencast video to be finalized
          await new Promise((resolve) => setTimeout(resolve, 5000));

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
        error,
        `${InspectorSingleEventService.name}.${InspectorSingleEventService.prototype.inspectDataLayer.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
