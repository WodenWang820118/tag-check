/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { StepExecutorService } from './step-executor/step-executor.service';
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { EventsGatewayService } from '../../core/events-gateway/events-gateway.service';
import { OperationFile } from '@utils';

@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService,
    private readonly eventsGatewayService: EventsGatewayService,
    private readonly stepExecutorService: StepExecutorService
  ) {}

  async performOperation(
    page: Page,
    projectSlug: string,
    eventId: string,
    application: EventInspectionPresetDto['application']
  ) {
    const operation = this.fileService.readJsonFile<OperationFile>(
      await this.filePathService.getOperationFilePath(projectSlug, eventId)
    );
    if (!operation || !operation.steps) return;

    let isLastStep = false;
    const lastStep = operation.steps.length;

    for (let i = 0; i < operation.steps.length; i++) {
      const step = operation.steps[i];

      if (i === operation.steps.length - 1) isLastStep = true;

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
  }
}
