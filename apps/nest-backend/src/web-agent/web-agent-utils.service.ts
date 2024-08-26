import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ActionService } from './action/action.service';
import { DataLayerService } from './web-monitoring/data-layer/data-layer.service';
import { Page, Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { extractEventNameFromId } from '@utils';

@Injectable()
export class WebAgentUtilsService {
  constructor(
    private actionService: ActionService,
    private dataLayerService: DataLayerService
  ) {}

  async performTest(
    page: Page,
    projectName: string,
    eventId: string,
    captureRequest?: boolean,
    measurementId?: string,
    credentials?: Credentials,
    application?: EventInspectionPresetDto['application']
  ) {
    await this.dataLayerService.initSelfDataLayer(projectName, eventId);

    if (credentials) {
      await page.authenticate({
        username: credentials.username,
        password: credentials.password,
      });
    }

    let eventRequest: string = null;
    const eventName = extractEventNameFromId(eventId);
    // 2) capture the request if needed
    if (captureRequest) {
      Logger.log(
        'Capturing request',
        `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
      );
      page.on('request', (interceptedRequest) => {
        if (
          interceptedRequest.url().includes(`en=${eventName}`) &&
          interceptedRequest.url().includes(`tid=${measurementId}`)
        ) {
          Logger.log(
            `Request captured: ${interceptedRequest.url()}`,
            `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
          );
          eventRequest = interceptedRequest.url();
          page.off('request');
        } else {
          Logger.log(
            `Request not captured: ${interceptedRequest.url()}`,
            `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
          );
        }
      });
    }

    // 3) perform the test operation
    try {
      await this.actionService.performOperation(
        page,
        projectName,
        eventId,
        application
      );
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 10000,
        });
      } catch (error) {
        Logger.error(
          'No navigation needed',
          `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
        );
      }
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectName,
        eventId
      );
      const dataLayer = await this.dataLayerService.getMyDataLayer(
        projectName,
        eventId
      );

      const destinationUrl = page.url();

      Logger.log(
        'Test completed',
        `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
      );
      return {
        dataLayer,
        eventRequest,
        destinationUrl,
      };
    } catch (error) {
      Logger.error(
        error,
        `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
      );
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
