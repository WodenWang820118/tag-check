/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { ActionService } from './action/action.service';
import { DataLayerService } from './action/web-monitoring/data-layer/data-layer.service';
import { Page, Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { RequestInterceptorService } from './action/request-interceptor/request-interceptor.service';
import { catchError, firstValueFrom, map } from 'rxjs';

@Injectable()
export class WebAgentUtilsService {
  private readonly logger = new Logger(WebAgentUtilsService.name);
  constructor(
    private readonly actionService: ActionService,
    private readonly dataLayerService: DataLayerService,
    private readonly requestInterceptorService: RequestInterceptorService
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
    let eventRequest = '';
    await this.dataLayerService.initSelfDataLayer(projectSlug, eventId);

    if (credentials) await this.authenticate(page, credentials);

    // 2) capture the request if needed
    if (captureRequest) {
      await this.setupRequestInterception(
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

      // 4) capture the request if needed; otherwise, it's an empty string
      if (captureRequest) {
        eventRequest = await this.captureEventRequest();
      }

      await this.waitForNavigation(page);
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectSlug,
        eventId
      );

      const dataLayer = await this.getOptimizedDataLayer(projectSlug, eventId);
      const destinationUrl = page.url();

      this.logger.log('Test completed');

      return {
        dataLayer,
        eventRequest,
        destinationUrl
      };
    } catch (error) {
      this.logger.error(`Failed to perform test: ${error}`);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async authenticate(
    page: Page,
    credentials: Credentials
  ): Promise<void> {
    try {
      await page.authenticate(credentials);
    } catch (error) {
      this.logger.error(`Authentication failed: ${error}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private async setupRequestInterception(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string
  ): Promise<void> {
    this.logger.log('Setting up interception', WebAgentUtilsService.name);
    await this.requestInterceptorService.setupInterception(
      page,
      projectSlug,
      eventId,
      measurementId
    );
  }

  private async captureEventRequest(): Promise<string> {
    const eventRequest = await firstValueFrom(
      this.requestInterceptorService.getRawRequest().pipe(
        map((request) => {
          if (request) {
            this.logger.log(`Request captured in web-agent: ${request}`);
            return request;
          }
          this.logger.error('No request captured');
          return '';
        }),
        catchError((error) => {
          this.logger.error(`Failed to capture request: ${error}`);
          return '';
        })
      )
    );
    this.requestInterceptorService.clearRawRequest();
    return eventRequest;
  }

  private async waitForNavigation(page: Page): Promise<void> {
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 5000
      });
    } catch (error) {
      this.logger.log('No navigation needed', WebAgentUtilsService.name);
    }
  }

  private async getOptimizedDataLayer(projectSlug: string, eventId: string) {
    const dataLayer = await this.dataLayerService.getMyDataLayer(
      projectSlug,
      eventId
    );
    return dataLayer.map(
      (event: { [x: string]: any; 'gtm.uniqueEventId': any }) => {
        const { 'gtm.uniqueEventId': _, ...rest } = event;
        return rest;
      }
    );
  }
}
