/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { StepExecutorService } from './step-executor/step-executor.service';
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { EventsGatewayService } from '../../events-gateway/events-gateway.service';

@Injectable()
export class ActionService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private eventsGatewayService: EventsGatewayService,
    private stepExecutorService: StepExecutorService
  ) {}

  async performOperation(
    page: Page,
    projectSlug: string,
    eventId: string,
    application: EventInspectionPresetDto['application']
  ) {
    try {
      const operation: { steps: any[] } = this.fileService.readJsonFile(
        await this.filePathService.getOperationFilePath(projectSlug, eventId)
      );
      if (!operation || !operation.steps) return;

      let isLastStep = false;
      const lastStep = operation.steps.length;

      for (let i = 0; i < operation.steps.length; i++) {
        const step = operation.steps[i];

        if (i === operation.steps.length - 1) isLastStep = true;

        const state = {
          isFirstNavigation: true,
        };

        Logger.log(
          `Performing step ${i + 1} of ${lastStep}`,
          `${ActionService.name}.${ActionService.prototype.performOperation.name}`
        );

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

      Logger.log(
        'Operation performed successfully',
        `${ActionService.name}.${ActionService.prototype.performOperation.name}`
      );
    } catch (error) {
      Logger.error(
        error,
        `${ActionService.name}.${ActionService.prototype.performOperation.name}`
      );
    }
  }
}
