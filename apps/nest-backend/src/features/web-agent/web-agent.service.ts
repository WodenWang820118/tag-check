import { Injectable } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
@Injectable()
export class WebAgentService {
  constructor(private readonly webAgentUtilsService: WebAgentUtilsService) {}

  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application']
  ) {
    const captureFlag = captureRequest === 'true' || captureRequest === '1';
    const { dataLayer, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        eventId,
        measurementId,
        credentials,
        captureFlag,
        application
      );
    return {
      dataLayer,
      destinationUrl
    };
  }

  async executeAndGetDataLayerAndRequest(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application']
  ) {
    const captureFlag = captureRequest === 'true' || captureRequest === '1';
    const { dataLayer, eventRequest, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectSlug,
        eventId,
        measurementId,
        credentials,
        captureFlag,
        application
      );
    return {
      dataLayer,
      eventRequest,
      destinationUrl
    };
  }
}
