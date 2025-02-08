/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { StrictDataLayerEvent, ValidationResult } from '@utils';
import { FileService } from '../../infrastructure/os/file/file.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { RequestProcessorService } from '../../features/request-processor/request-processor.service';
import { Credentials, Page } from 'puppeteer';
import { InspectorUtilsService } from './inspector-utils.service';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';
@Injectable()
export class InspectorSingleEventService {
  private readonly logger = new Logger(InspectorSingleEventService.name);
  constructor(
    private readonly webAgentService: WebAgentService,
    private readonly fileService: FileService,
    private readonly requestProcessorService: RequestProcessorService,
    private readonly inspectorUtilsService: InspectorUtilsService,
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly testImageRepositoryService: TestImageRepositoryService
  ) {}
  // TODO: use DB instead of OS system
  // inspect one event
  async inspectDataLayer(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application']
  ) {
    const spec =
      await this.specRepositoryService.getSpecByProjectSlugAndEventId(
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
        spec.dataLayerSpec
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
      spec.dataLayerSpec
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
    expectedObj: StrictDataLayerEvent
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
    // TODO: cached file might be suitable to be stored in the DB
    await this.fileService.writeCacheFile(projectSlug, eventId, result);
    const screenshot = await page.screenshot({
      fullPage: true
    });

    await this.testImageRepositoryService.create(projectSlug, eventId, {
      imageName: 'screenshot.png',
      imageData: screenshot
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
    spec: StrictDataLayerEvent
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
      spec
    );

    const rawRequest = result.eventRequest;
    const recomposedRequest = this.requestProcessorService.recomposeGA4ECEvent(
      result.eventRequest
    );

    const requestCheckResult = this.inspectorUtilsService.isDataLayerCorrect(
      [recomposedRequest],
      spec
    );

    const destinationUrl = result.destinationUrl;
    await this.fileService.writeCacheFile(projectSlug, eventId, result);
    const screenshot = await page.screenshot({
      fullPage: true
    });

    await this.testImageRepositoryService.create(projectSlug, eventId, {
      imageName: 'screenshot.png',
      imageData: screenshot
    });

    return {
      dataLayerResult,
      destinationUrl,
      rawRequest,
      requestCheckResult
    };
  }
}
