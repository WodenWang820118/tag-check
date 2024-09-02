import { Injectable } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
@Injectable()
export class WebAgentService {
  constructor(private webAgentUtilsService: WebAgentUtilsService) {}
  private abortController: AbortController | null = null;

  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    eventId: string,
    credentials: Credentials,
    application: EventInspectionPresetDto['application']
  ) {
    const { dataLayer, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        eventId,
        false,
        '',
        credentials,
        application
      );
    return {
      dataLayer,
      destinationUrl,
    };
  }

  async executeAndGetDataLayerAndRequest(
    page: Page,
    projectName: string,
    testName: string,
    measurementId: string,
    credentials: Credentials,
    application: EventInspectionPresetDto['application']
  ) {
    const { dataLayer, eventRequest, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        testName,
        true,
        measurementId,
        credentials,
        application
      );
    return {
      dataLayer,
      eventRequest,
      destinationUrl,
    };
  }

  stopOperation() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
