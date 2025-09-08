import { Injectable, Logger } from '@nestjs/common';
import { StrictDataLayerEvent, ValidationResult } from '@utils';
import { FileService } from '../../infrastructure/os/file/file.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { RequestProcessorService } from '../../features/request-processor/request-processor.service';
import { Credentials, Page } from 'puppeteer';
import { InspectorUtilsService } from './inspector-utils.service';
import { InspectDataLayerDto } from '../../shared/dto/inspect-data-layer.dto';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';
import { ItemDefRepositoryService } from '../../core/repository/item-def/item-def-repository.service';
@Injectable()
export class InspectorSingleEventService {
  private readonly logger = new Logger(InspectorSingleEventService.name);
  constructor(
    private readonly webAgentService: WebAgentService,
    private readonly fileService: FileService,
    private readonly requestProcessorService: RequestProcessorService,
    private readonly inspectorUtilsService: InspectorUtilsService,
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly itemDefRepositoryService: ItemDefRepositoryService
  ) {}

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
    // Fetch the project spec and extract the data layer spec
    const projectSpec =
      await this.specRepositoryService.getSpecByProjectSlugAndEventId(
        projectSlug,
        eventId
      );

    const itemDef = await this.itemDefRepositoryService.getItemDefById(
      projectSpec.eventName
    );
    const ecommerce = projectSpec.dataLayerSpec.ecommerce;
    if (ecommerce?.items && itemDef) {
      ecommerce.items = [itemDef.fullItemDef];
    }

    // Create DTO for inspection parameters
    const dto: InspectDataLayerDto = {
      measurementId,
      credentials,
      captureRequest,
      application,
      spec: projectSpec
    };

    // Debug the extracted data layer spec from DTO
    this.logger.debug(
      JSON.stringify(dto.spec, null, 2),
      'Expected Spec (from DTO): '
    );

    if (dto.captureRequest === 'false' || !dto.captureRequest) {
      return await this.handleNoCaptureRequest(page, projectSlug, eventId, dto);
    }

    return await this.handleCaptureRequest(page, projectSlug, eventId, dto);
  }

  private async handleNoCaptureRequest(
    page: Page,
    projectSlug: string,
    eventId: string,
    dto: InspectDataLayerDto
  ) {
    this.logger.log(`MeasurementId is empty`);
    const result = await this.webAgentService.executeAndGetDataLayer(
      page,
      projectSlug,
      eventId,
      dto.measurementId || '',
      dto.credentials || { username: '', password: '' },
      dto.captureRequest || 'false',
      dto.application
    );

    // 3. Compare the result with the project spec
    // 3.1 Get the corresponding event object from the result
    // 3.2 Compare the expectedObj with the result, applying strategies
    const dataLayerResults = result.dataLayer as StrictDataLayerEvent[];
    this.logger.debug(
      'Data layer results in inspector single event before validation:',
      JSON.stringify(dataLayerResults, null, 2)
    );
    const dataLayerResult = this.inspectorUtilsService.isDataLayerCorrect(
      dataLayerResults,
      dto.spec.dataLayerSpec
    );

    this.logger.log(
      'data layer result in inspector single event: ',
      JSON.stringify(dataLayerResult, null, 2)
    );
    const destinationUrl = result.destinationUrl;
    this.logger.log(`Destination URL: ${destinationUrl}`);
    // TODO: cached file might be suitable to be stored in the DB
    await this.fileService.writeCacheFile(projectSlug, eventId, result);
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
    dto: InspectDataLayerDto
  ) {
    const result = await this.webAgentService.executeAndGetDataLayerAndRequest(
      page,
      projectSlug,
      eventId,
      dto.measurementId || '',
      dto.credentials || { username: '', password: '' },
      dto.captureRequest || 'false',
      dto.application
    );

    // 3. Compare the result with the project spec
    // 3.1 Get the corresponding event object from the result
    // 3.2 Compare the expectedObj with the result, applying strategies
    const dataLayerResults = result.dataLayer as StrictDataLayerEvent[];
    const dataLayerResult = this.inspectorUtilsService.isDataLayerCorrect(
      dataLayerResults,
      dto.spec.dataLayerSpec
    );

    const rawRequest = result.eventRequest;
    const recomposedRequest = this.requestProcessorService.recomposeGA4ECEvent(
      result.eventRequest
    );

    const requestCheckResult = this.inspectorUtilsService.isDataLayerCorrect(
      [recomposedRequest as StrictDataLayerEvent],
      dto.spec.dataLayerSpec
    );

    const destinationUrl = result.destinationUrl;
    await this.fileService.writeCacheFile(projectSlug, eventId, result);

    return {
      dataLayerResult,
      destinationUrl,
      rawRequest,
      requestCheckResult
    };
  }
}
