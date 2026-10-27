import { Injectable, Logger } from '@nestjs/common';
import { Credentials, Page } from 'puppeteer';
import { InspectorSingleEventService } from '../../features/inspector/inspector-single-event.service';
import {
  CreateTestEventDetailDto,
  EventInspectionPresetDto,
  TestEventEntity,
  UpdateTestEventDto
} from '../../shared';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { RunTimelineService } from '../../core/events-gateway/run-timeline.service';
import { RunStepFallbackService } from '../../core/events-gateway/run-step-fallback.service';
import { RunRecordingsService } from '../../infrastructure/os/run-recordings/run-recordings.service';
import {
  describeStepFailure,
  describeStepFallback,
  type StepFailureContext,
  ValidationResult
} from '@utils';
import { StepElementNotFoundError } from '../web-agent/action/step-failure/step-element-not-found.error';
import { buildMediaTimeline, type RunMedia } from './run-media';

/**
 * What `singleEventInspectionRecipe` resolves with: the run's checks, or
 * undefined when the run failed and was saved as failed.
 */
export type SingleEventInspectionResult =
  | {
      dataLayerResult: ValidationResult;
      rawRequest: string;
      requestCheckResult: ValidationResult | null;
      destinationUrl: string;
    }[]
  | undefined;

/**
 * Runs the checks on a page the caller has prepared and saves the run's
 * result: one TestEventDetail row with the run's screenshot, its recordings'
 * folder and step timeline, which then becomes the test's latest result.
 */
@Injectable()
export class EventInspectionPipelineService {
  private readonly logger = new Logger(EventInspectionPipelineService.name);

  constructor(
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly testImageRepositoryService: TestImageRepositoryService,
    private readonly runTimelineService: RunTimelineService,
    private readonly runStepFallbackService: RunStepFallbackService,
    private readonly runRecordingsService: RunRecordingsService
  ) {}

  /**
   * Replays the test on `page`, checks the dataLayer (and the GA4 request
   * when `captureRequest` is set) and saves the result.
   *
   * When the replay or a check throws, the run is saved as failed and the
   * method resolves with undefined: the caller reads the result from the
   * saved report. It rejects only when the result cannot be saved; for a
   * failed run it then rejects with the run's own error.
   *
   * `media` is the run's recordings, which the caller starts and stops.
   */
  async singleEventInspectionRecipe(
    page: Page,
    projectSlug: string,
    eventId: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    eventInspectionPresetDto: EventInspectionPresetDto,
    media: RunMedia | null = null
  ): Promise<SingleEventInspectionResult> {
    this.logger.log('Inspecting single event');
    const testEvent =
      await this.testEventRepositoryService.getEntityBySlugAndEventId(
        projectSlug,
        eventId
      );

    let inspection: Awaited<
      ReturnType<InspectorSingleEventService['inspectDataLayer']>
    >;
    try {
      inspection = await this.inspectorSingleEventService.inspectDataLayer(
        page,
        projectSlug,
        eventId,
        measurementId,
        credentials,
        captureRequest,
        eventInspectionPresetDto.application
      );
    } catch (error) {
      this.logger.error('Error during event inspection', error);
      try {
        await this.saveResult(
          page,
          projectSlug,
          eventId,
          testEvent,
          this.buildFallbackTestEventDetail(error),
          media,
          error instanceof StepElementNotFoundError ? error.context : null
        );
      } catch (saveError) {
        // The run's own error says more than the failure to save it.
        this.logger.error(`Failed to save the failed run: ${saveError}`);
        throw error;
      }
      return undefined;
    }

    // Saved outside the try above: a failure to save a finished run must
    // not save it a second time as failed.
    const { dataLayerResult, destinationUrl, rawRequest, requestCheckResult } =
      inspection;
    this.logger.debug(
      'data layer result:',
      JSON.stringify(dataLayerResult, null, 2)
    );
    const data = [
      {
        dataLayerResult,
        rawRequest,
        requestCheckResult,
        destinationUrl
      }
    ];
    this.logger.debug('Data to be saved:', JSON.stringify(data, null, 2));

    const updatedDetail = this.buildTestEventDetail(inspection, eventId);
    this.logger.debug(
      'Updated detail:',
      JSON.stringify(updatedDetail, null, 2)
    );
    await this.saveResult(
      page,
      projectSlug,
      eventId,
      testEvent,
      updatedDetail,
      media
    );
    return data;
  }

  /**
   * Saves the run's screenshot, then its result linked to it and to its
   * recordings, and points the test at both as its latest. What a failed
   * step saw (`stepFailure`) goes beside the recordings. Older runs past
   * RUN_RECORDINGS_KEPT then lose their recordings.
   */
  private async saveResult(
    page: Page,
    projectSlug: string,
    eventId: string,
    testEvent: TestEventEntity,
    detail: CreateTestEventDetailDto,
    media: RunMedia | null,
    stepFailure: StepFailureContext | null = null
  ): Promise<void> {
    const screenshot = await page.screenshot({ fullPage: true });
    const testImage = await this.testImageRepositoryService.create(
      projectSlug,
      eventId,
      { imageName: `screenshot.png`, imageData: screenshot }
    );
    // A run whose site recording never started has no recordings.
    const recorded = media?.site ? media : null;
    const testEventDetail = await this.testEventDetailRepositoryService.create(
      testEvent,
      {
        ...detail,
        recordingKey: recorded?.recordingKey ?? null,
        mediaTimeline: recorded
          ? buildMediaTimeline(
              this.runTimelineService.steps(eventId),
              recorded.site?.firstFrameAt ?? null,
              recorded.tagAssistant?.firstFrameAt ?? null
            )
          : null
      },
      testImage
    );

    const updatedInfo: UpdateTestEventDto = {
      latestTestEventDetailId: testEventDetail.id,
      latestTestImageId: testImage.id,
      message: testEventDetail.message
    };
    const updatedEvent = await this.testEventRepositoryService.updateTestEvent(
      testEvent.id,
      updatedInfo
    );
    this.logger.debug('Updated info:', JSON.stringify(updatedInfo, null, 2));
    this.logger.debug('Updated event:', JSON.stringify(updatedEvent, null, 2));
    if (recorded) {
      if (stepFailure) {
        await this.runRecordingsService.saveStepFailure(
          projectSlug,
          eventId,
          recorded.recordingKey,
          stepFailure
        );
      }
      await this.runRecordingsService.prune(projectSlug, eventId, testEvent.id);
    }
  }

  /**
   * The result row of a run whose checks finished. A step that continued
   * with a fallback selector adds one sentence to the message.
   */
  private buildTestEventDetail(
    result: {
      dataLayerResult: ValidationResult;
      destinationUrl: string;
      rawRequest: string;
      requestCheckResult: ValidationResult | null;
    },
    eventId: string
  ): CreateTestEventDetailDto {
    const notes = this.runStepFallbackService
      .fallbacks(eventId)
      .map((fallback) => describeStepFallback(fallback));
    // The check's message, such as "Valid", has no full stop of its own.
    const checkMessage = result.dataLayerResult.message || '';
    const message = [
      notes.length > 0 && checkMessage !== '' && !/[.!?]$/.test(checkMessage)
        ? `${checkMessage}.`
        : checkMessage,
      ...notes
    ]
      .filter((part) => part !== '')
      .join(' ');
    return {
      passed: result.dataLayerResult.passed || false,
      requestPassed: result.requestCheckResult?.passed || false,
      rawRequest: result.rawRequest,
      destinationUrl: result.destinationUrl,
      dataLayer: result.dataLayerResult.dataLayer,
      message,
      requestMessage: result.requestCheckResult?.message ?? null
    };
  }

  /** The result row of a run that stopped before its checks finished. */
  /**
   * The result row of a run that stopped before its checks finished. A step
   * that could not find its element is named in the message.
   */
  private buildFallbackTestEventDetail(
    error: unknown
  ): CreateTestEventDetailDto {
    const message =
      error instanceof StepElementNotFoundError && error.stepIndex !== null
        ? describeStepFailure({
            stepIndex: error.stepIndex,
            stepType: error.context?.stepType ?? null,
            selectorCount: error.selectors.length,
            timeoutMs: error.timeoutMs
          })
        : 'The run stopped with an error before its checks finished.';
    return {
      passed: false,
      requestPassed: false,
      rawRequest: '',
      destinationUrl: '',
      dataLayer: [],
      message
    };
  }
}
