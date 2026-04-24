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
import type { RequestInterceptionHandle } from './action/request-interceptor/request-interceptor.service';
import {
  catchError,
  defaultIfEmpty,
  firstValueFrom,
  map,
  of,
  timeout,
  TimeoutError
} from 'rxjs';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';

@Injectable()
export class WebAgentUtilsService {
  private readonly logger = new Logger(WebAgentUtilsService.name);
  constructor(
    private readonly actionService: ActionService,
    private readonly dataLayerService: DataLayerService,
    private readonly requestInterceptorService: RequestInterceptorService,
    private readonly testEventRepositoryService: TestEventRepositoryService
  ) {}

  async performTest(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: boolean,
    application: EventInspectionPresetDto['application'],
    options?: { requestCaptureTimeoutMs?: number }
  ) {
    let eventRequest = '';
    let requestInterception: RequestInterceptionHandle | null = null;
    await this.dataLayerService.initSelfDataLayer(projectSlug, eventId);

    if (credentials) await this.authenticate(page, credentials);
    const testEventEntity =
      await this.testEventRepositoryService.getEntityByEventId(eventId);
    // 2) capture the request if needed
    if (captureRequest) {
      requestInterception = await this.setupRequestInterception(
        page,
        projectSlug,
        eventId,
        testEventEntity.eventName,
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
        if (!requestInterception) {
          throw new Error('Request interception handle is required');
        }
        eventRequest = await this.captureEventRequest(
          requestInterception,
          options?.requestCaptureTimeoutMs
        );
      }

      await this.waitForNavigation(page);
      await this.dataLayerService.updateSelfDataLayer(
        page,
        projectSlug,
        eventId
      );

      const dataLayer = (await this.getOptimizedDataLayer(
        projectSlug,
        eventId
      )) as any[];
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
    } finally {
      await requestInterception
        ?.stop()
        .catch((error) =>
          this.logger.warn(`Failed to stop request interception: ${error}`)
        );
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
    eventName: string,
    measurementId: string
  ): Promise<RequestInterceptionHandle> {
    this.logger.log('Setting up interception', WebAgentUtilsService.name);
    this.logger.log(
      `Event Name: ${eventName}, Measurement ID: ${measurementId}`,
      WebAgentUtilsService.name
    );
    return await this.requestInterceptorService.setupInterception(
      page,
      projectSlug,
      eventId,
      eventName,
      measurementId
    );
  }

  private async captureEventRequest(
    requestInterception: RequestInterceptionHandle,
    timeoutMs = 15000
  ): Promise<string> {
    if (!requestInterception) {
      throw new Error('Request interception handle is required');
    }

    const eventRequest = await firstValueFrom(
      requestInterception.rawRequest$.pipe(
        timeout(timeoutMs),
        defaultIfEmpty(''),
        map((request) => {
          if (request) {
            this.logger.log(
              `Request captured in web-agent: ${JSON.stringify(request, null, 2)}`
            );
            return request;
          }
          this.logger.error('No request captured');
          return '';
        }),
        catchError((error) => {
          if (error instanceof TimeoutError) {
            this.logger.warn('Timeout occurred while waiting for raw request');
            return of('');
          }
          this.logger.error(`Failed to capture request: ${error}`);
          return of('');
        })
      )
    );
    return eventRequest;
  }

  private async waitForNavigation(page: Page): Promise<void> {
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 5000
      });
    } catch (error) {
      this.logger.warn(`Navigation failed: ${JSON.stringify(error, null, 2)}`);
      this.logger.log('No navigation needed', WebAgentUtilsService.name);
    }
  }

  private async getOptimizedDataLayer(projectSlug: string, eventId: string) {
    const dataLayer = await this.dataLayerService.getMyDataLayer(
      projectSlug,
      eventId
    );
    this.logger.log('Optimized data layer:', dataLayer);
    return (dataLayer as any[]).map(
      (event: { [x: string]: any; 'gtm.uniqueEventId': string }) => {
        const { 'gtm.uniqueEventId': _, ...rest } = event;
        return rest;
      }
    );
  }
}
