import { Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials, Page } from 'puppeteer';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
@Injectable()
export class WebAgentService {
  constructor(private webAgentUtilsService: WebAgentUtilsService) {}
  private currentBrowser: Browser | null = null;
  private abortController: AbortController | null = null;

  async executeAndGetDataLayer(
    page: Page,
    projectName: string,
    eventId: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
  ) {
    const { dataLayer, destinationUrl } =
      await this.webAgentUtilsService.performTest(
        page,
        projectName,
        eventId,
        false,
        null,
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
    measurementId?: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
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

  private async cleanup() {
    Logger.log(
      'Cleaning up resources',
      `${WebAgentService.name}.${WebAgentService.prototype.cleanup.name}`
    );
    if (this.currentBrowser) {
      try {
        // Close all pages
        const pages = await this.currentBrowser.pages();
        await Promise.all(pages.map((page) => page.close()));
        await this.currentBrowser.close();
      } catch (err) {
        Logger.error(
          err,
          `${WebAgentService.name}.${WebAgentService.prototype.cleanup.name}`
        );
      } finally {
        this.currentBrowser = null;
        this.abortController = null;
      }
    }
  }
}
