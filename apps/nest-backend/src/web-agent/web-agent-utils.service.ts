/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ActionService } from './action/action.service';
import { DataLayerService } from './action/web-monitoring/data-layer/data-layer.service';
import { Page, Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '../dto/event-inspection-preset.dto';
import { RequestInterceptorService } from './action/request-interceptor/request-interceptor.service';
import { firstValueFrom, map, take } from 'rxjs';

@Injectable()
export class WebAgentUtilsService {
  constructor(
    private actionService: ActionService,
    private dataLayerService: DataLayerService,
    private requestInterceptorService: RequestInterceptorService
  ) {}

  async performTest(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: boolean,
    application: EventInspectionPresetDto['application']
  ) {
    await this.dataLayerService.initSelfDataLayer(projectSlug, eventId);

    if (credentials) {
      await page.authenticate({
        username: credentials.username,
        password: credentials.password,
      });
    }

    // 2) capture the request if needed
    if (captureRequest) {
      await this.requestInterceptorService.setupInterception(
        page,
        projectSlug,
        eventId,
        measurementId
      );
    }

    // 3) perform the test operation
    try {
      await this.actionService.performOperation(
        page,
        projectSlug,
        eventId,
        application
      );

      const eventRequest = await firstValueFrom(
        this.requestInterceptorService.getRawRequest().pipe(
          take(1),
          map((request) => {
            Logger.log(
              `Request captured in web-agent: ${request}`,
              'WebAgentUtilsService.performTest'
            );
            return request;
          })
        )
      );

      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 5000,
        });
      } catch (error) {
        Logger.log(
          'No Navigation Needed',
          `${WebAgentUtilsService.name}.${WebAgentUtilsService.prototype.performTest.name}`
        );
      }
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectSlug,
        eventId
      );
      const dataLayer = await this.dataLayerService.getMyDataLayer(
        projectSlug,
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
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
