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

/**
 * Parameters required to execute a single test run via {@link WebAgentUtilsService.performTest}.
 */
export interface PerformTestParams {
  /** Puppeteer page instance on which actions are performed. */
  page: Page;
  /** Slug that identifies the project owning this test event. */
  projectSlug: string;
  /** Unique identifier for the test event being executed. */
  eventId: string;
  /** GA4 measurement ID used to correlate the captured network request. */
  measurementId: string;
  /** HTTP basic-auth credentials forwarded to the page before navigation. */
  credentials: Credentials;
  /** When `true`, the service intercepts the outgoing GA4 hit and returns its raw payload. */
  captureRequest: boolean;
  /** Target application descriptor that drives which action sequence to execute. */
  application: EventInspectionPresetDto['application'];
  /** Optional tunables for this run. */
  options?: {
    /** Maximum milliseconds to wait for the GA4 network hit before returning an empty string. Defaults to 15 000 ms. */
    requestCaptureTimeoutMs?: number;
  };
}

@Injectable()
export class WebAgentUtilsService {
  private readonly logger = new Logger(WebAgentUtilsService.name);
  constructor(
    private readonly actionService: ActionService,
    private readonly dataLayerService: DataLayerService,
    private readonly requestInterceptorService: RequestInterceptorService,
    private readonly testEventRepositoryService: TestEventRepositoryService
  ) {}

  /**
   * Executes a full test run for a single event and returns the captured telemetry.
   *
   * Sequence:
   * 1. Initialise the data-layer snapshot baseline.
   * 2. Optionally authenticate the page with the supplied credentials.
   * 3. Optionally arm GA4 request interception.
   * 4. Execute the recorded action sequence via {@link ActionService}.
   * 5. Capture the intercepted GA4 hit (if `captureRequest` is `true`).
   * 6. Wait for post-action navigation to settle.
   * 7. Snapshot the final data layer and strip internal GTM keys.
   *
   * The request interception handle is always torn down in the `finally` block
   * so it is safe to call even when the action sequence throws.
   *
   * @param params - All inputs needed for one test execution; see {@link PerformTestParams}.
   * @returns An object containing `dataLayer` (stripped GTM events), `eventRequest`
   *          (raw GA4 hit string, empty when not captured), and `destinationUrl`
   *          (final page URL after all navigation).
   * @throws {HttpException} with status 500 when the action sequence fails.
   */
  async performTest(params: PerformTestParams) {
    const {
      page,
      projectSlug,
      eventId,
      measurementId,
      credentials,
      captureRequest,
      application,
      options
    } = params;
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
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await requestInterception
        ?.stop()
        .catch((error) =>
          this.logger.warn(`Failed to stop request interception: ${error}`)
        );
    }
  }

  /**
   * Applies HTTP basic-auth credentials to the Puppeteer page.
   *
   * @throws {UnauthorizedException} when Puppeteer rejects the credentials.
   */
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

  /**
   * Arms network request interception on the page so that the outgoing GA4 hit
   * can be observed via {@link RequestInterceptionHandle.rawRequest$}.
   *
   * @returns A handle that exposes `rawRequest$` and a `stop()` teardown.
   */
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

  /**
   * Waits for the first value emitted by the interception observable and
   * returns the raw GA4 request payload as a string.
   *
   * Returns an empty string on timeout or when the observable completes without
   * emitting — callers should treat an empty string as "no hit captured".
   *
   * @param requestInterception - Active interception handle from {@link setupRequestInterception}.
   * @param timeoutMs - Milliseconds before giving up; defaults to 15 000.
   */
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

  /**
   * Waits up to 5 s for the page to reach `networkidle0` after the action
   * sequence completes. Navigation timeouts are swallowed because many test
   * flows do not trigger a top-level navigation.
   */
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

  /**
   * Retrieves the data-layer snapshot for the event and removes the
   * `gtm.uniqueEventId` key that GTM injects into every push, since that
   * internal counter is not meaningful to callers.
   *
   * @returns The stripped data-layer event array.
   */
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
