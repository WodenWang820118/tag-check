import { HttpException, Injectable, Logger } from '@nestjs/common';
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
      Logger.log('capturing request', 'WebAgentUtils.performTest');
      page.on('request', (interceptedRequest) => {
        if (
          interceptedRequest.url().includes(`en=${eventName}`) &&
          interceptedRequest.url().includes(`tid=${measurementId}`)
        ) {
          Logger.log(
            interceptedRequest.url(),
            'WebAgentUtils.performTest: request captured'
          );
          eventRequest = interceptedRequest.url();
          page.off('request');
        } else {
          Logger.log(
            interceptedRequest.url(),
            'WebAgentUtils.performTest: monitoring request'
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
        Logger.log('no navigation needed', 'WebAgentUtils.performTest');
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

      Logger.log('test completed', 'WebAgentUtils.performTest');
      return {
        dataLayer,
        eventRequest,
        destinationUrl,
      };
    } catch (error) {
      Logger.error(error.message, 'WebAgent.performTest');
      throw new HttpException(error.message, 500);
    }
  }
}
