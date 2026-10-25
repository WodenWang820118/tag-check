import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { StepExecutorService } from './step-executor/step-executor.service';
import { EventInspectionPresetDto } from '../../../shared/dto/event-inspection-preset.dto';
import { ProgressEventsService } from '../../../core/events-gateway/progress-events.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';

/**
 * Replays a test's Chrome Recorder recording on a page, step by step, and
 * reports progress over SSE. A test without a recording replays nothing.
 * Rejects with the error of the first step that fails.
 */
@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);
  constructor(
    private readonly progressEventsService: ProgressEventsService,
    private readonly stepExecutorService: StepExecutorService,
    private readonly recordingRepositoryService: RecordingRepositoryService
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
      this.progressEventsService.sendProgressUpdate(totalSteps, i + 1);

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
        isLastClick: i === lastClickIndex
      });
    }
    this.logger.log('Operation performed successfully');
    this.progressEventsService.sendEventCompleted(eventId);
  }
}
