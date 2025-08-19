import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { StepExecutorService } from './step-executor/step-executor.service';
import { EventInspectionPresetDto } from '../../../shared/dto/event-inspection-preset.dto';
import { EventsGatewayService } from '../../../core/events-gateway/events-gateway.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';

@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);
  constructor(
    private readonly eventsGatewayService: EventsGatewayService,
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
    const steps = operation.steps;

    if (!operation || !steps) return;

    let isLastStep = false;
    const lastStep = steps.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (i === steps.length - 1) isLastStep = true;

      const state = {
        isFirstNavigation: true
      };

      this.logger.log(`Performing step ${i + 1} of ${lastStep}`);
      this.eventsGatewayService.sendProgressUpdate(lastStep, i + 1); // Send progress update

      await this.stepExecutorService.executeStep(
        page,
        step,
        projectSlug,
        eventId,
        state,
        isLastStep,
        application
      );
    }
    this.logger.log('Operation performed successfully');
    this.eventsGatewayService.sendEventCompleted(eventId);
  }
}
