/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import {
  BaseDataLayerEvent,
  extractEventNameFromId,
  Spec,
  StrictDataLayerEvent,
  ValidationResult
} from '@utils';
import { FileService } from '../os/file/file.service';
import { FilePathService } from '../os/path/file-path/file-path.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { RequestProcessorService } from '../request-processor/request-processor.service';
import { Credentials, Page } from 'puppeteer';
import { InspectorUtilsService } from './inspector-utils.service';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { ImageResultService } from '../test-result/services/image-result.service';
@Injectable()
export class InspectorSingleEventService {
  private readonly logger = new Logger(InspectorSingleEventService.name);
  constructor(
    private readonly webAgentService: WebAgentService,
    private readonly fileService: FileService,
    private readonly requestProcessorService: RequestProcessorService,
    private readonly filePathService: FilePathService,
    private readonly inspectorUtilsService: InspectorUtilsService,
    private readonly imageResultService: ImageResultService
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
    const specs = await this.getProjectSpecs(projectSlug);
    const expectedObj = this.getExpectedObject(specs, eventId);
    const imageSavingFolder = await this.getImageSavingFolder(
      projectSlug,
      eventId
    );

    if (captureRequest === 'false') {
      return await this.handleNoCaptureRequest(
        page,
        projectSlug,
        eventId,
        measurementId,
        credentials,
        captureRequest,
        application,
        expectedObj,
        imageSavingFolder
      );
    }

    return await this.handleCaptureRequest(
      page,
      projectSlug,
      eventId,
      measurementId,
      credentials,
      captureRequest,
      application,
      expectedObj,
      imageSavingFolder
    );
  }

  private async handleNoCaptureRequest(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application'],
    expectedObj: StrictDataLayerEvent,
    imageSavingFolder: string
  ) {
    this.logger.log(`MeasurementId is empty`);
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
    this.logger.log(`Destination URL: ${destinationUrl}`);
    await this.fileService.writeCacheFile(projectSlug, eventId, result);
    const screenshot = await page.screenshot({
      // path: imageSavingFolder,
      fullPage: true
    });

    // await this.saveImage(projectSlug, eventId, imageSavingFolder);
    await this.imageResultService.create({
      eventId,
      name: 'screenshot.png',
      data: screenshot
    });

    return {
      dataLayerResult,
      destinationUrl,
      rawRequest: '',
      requestCheckResult: '' as unknown as ValidationResult
    };
  }

  private async handleCaptureRequest(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application'],
    expectedObj: StrictDataLayerEvent,
    imageSavingFolder: string
  ) {
    const result = await this.webAgentService.executeAndGetDataLayerAndRequest(
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
    const recomposedRequest = this.requestProcessorService.recomposeGA4ECEvent(
      result.eventRequest
    );

    const requestCheckResult = this.inspectorUtilsService.isDataLayerCorrect(
      [recomposedRequest],
      expectedObj
    );

    const destinationUrl = result.destinationUrl;
    await this.fileService.writeCacheFile(projectSlug, eventId, result);
    const screenshot = await page.screenshot({
      path: imageSavingFolder,
      fullPage: true
    });

    await this.imageResultService.create({
      eventId,
      name: 'screenshot.png',
      data: screenshot
    });

    return {
      dataLayerResult,
      destinationUrl,
      rawRequest,
      requestCheckResult
    };
  }

  private async getProjectSpecs(projectSlug: string) {
    const specsPath =
      await this.filePathService.getProjectConfigFilePath(projectSlug);
    const specs = this.fileService.readJsonFile<Spec[]>(specsPath);
    return specs;
  }

  private getExpectedObject(
    specs: Spec[],
    eventId: string
  ): StrictDataLayerEvent {
    const eventName = extractEventNameFromId(eventId);
    const spec = specs.find(
      (spec: BaseDataLayerEvent) => spec.event === eventName
    );
    if (!spec) {
      throw new Error(`No spec found for event ${eventName}`);
    }
    return spec;
  }

  private async getImageSavingFolder(
    projectSlug: string,
    eventId: string
  ): Promise<string> {
    return this.filePathService.getImageFilePath(projectSlug, eventId);
  }
}
