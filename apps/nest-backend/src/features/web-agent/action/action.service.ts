import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { StepExecutorService } from './step-executor/step-executor.service';
import { EventInspectionPresetDto } from '../../../shared/dto/event-inspection-preset.dto';
import { ProgressEventsService } from '../../../core/events-gateway/progress-events.service';
import { RunStatusService } from '../../../core/events-gateway/run-status.service';
import { RunTimelineService } from '../../../core/events-gateway/run-timeline.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
import { StepElementNotFoundError } from './step-failure/step-element-not-found.error';
import { StepFailureCollectorService } from './step-failure/step-failure-collector.service';

/**
 * Replays a test's Chrome Recorder recording on a page, step by step, and
 * reports each step to RunStatusService, which sends it over SSE and to the
 * desktop tray, and the moment each step acts to RunTimelineService. A test
 * without a recording replays nothing.
 * Rejects with the error of the first step that fails. When a step could not
 * find its element, that error carries the step's index and what the page
 * showed then.
 */
@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);
  constructor(
    private readonly progressEventsService: ProgressEventsService,
    private readonly stepExecutorService: StepExecutorService,
    private readonly recordingRepositoryService: RecordingRepositoryService,
    private readonly runStatusService: RunStatusService,
    private readonly runTimelineService: RunTimelineService,
    private readonly stepFailureCollector: StepFailureCollectorService
  ) {}

  async performOperation(
    page: Page,
    projectSlug: string,
    eventId: string,
    application: EventInspectionPresetDto['application']
  ) {
    const operation = await this.recordingRepositoryService.getRecordingDetails(
      projectSlug,
      eventId
    );
    const steps = operation?.steps;

    if (!operation || !steps) return;

    const totalSteps = steps.length;
    const state = {
      isFirstNavigation: true
    };
    const lastClickIndex = steps.map((step) => step.type).lastIndexOf('click');

    for (const [i, step] of steps.entries()) {
      this.logger.log(`Performing step ${i + 1} of ${totalSteps}`);
      this.runStatusService.step(eventId, totalSteps, i + 1);

      try {
        // Sequential on purpose: each step acts on the page the previous
        // steps left behind.
        await this.stepExecutorService.executeStep({
          page,
          step,
          projectSlug,
          eventId,
          state,
          isLastStep: i === totalSteps - 1,
          application,
          isLastClick: i === lastClickIndex,
          onAction: () => this.runTimelineService.markStep(eventId, i)
        });
      } catch (error) {
        if (error instanceof StepElementNotFoundError) {
          error.stepIndex = i;
          error.context = await this.stepFailureCollector.collect(
            page,
            step,
            i,
            error.timeoutMs
          );
        }
        throw error;
      }
    }
    this.logger.log('Operation performed successfully');
    this.progressEventsService.sendEventCompleted(eventId);
  }
}
