import { Injectable } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { isQueryFlagOn } from '../../shared/query-flag';
/**
 * Entry point of the inspector into the web agent: replays a test on a page
 * and returns what it captured. Both methods run the same replay; they
 * differ only in what they return.
 */
@Injectable()
export class WebAgentService {
  constructor(private readonly webAgentUtilsService: WebAgentUtilsService) {}

  /** Replays the test and returns the captured dataLayer and the final URL. */
  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application']
  ) {
    const captureFlag = isQueryFlagOn(captureRequest);
    const { dataLayer, destinationUrl } =
      await this.webAgentUtilsService.performTest({
        page,
        projectSlug: projectName,
        eventId,
        measurementId,
        credentials,
        captureRequest: captureFlag,
        application
      });
    return {
      dataLayer,
      destinationUrl
    };
  }

  /**
   * Replays the test and also returns the GA4 request matched for the event
   * (an empty string when none was captured, or when `captureRequest` is not
   * "true" or "1").
   */
  async executeAndGetDataLayerAndRequest(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    application: EventInspectionPresetDto['application']
  ) {
    const captureFlag = isQueryFlagOn(captureRequest);
    const { dataLayer, eventRequest, destinationUrl } =
      await this.webAgentUtilsService.performTest({
        page,
        projectSlug,
        eventId,
        measurementId,
        credentials,
        captureRequest: captureFlag,
        application
      });
    return {
      dataLayer,
      eventRequest,
      destinationUrl
    };
  }
}
