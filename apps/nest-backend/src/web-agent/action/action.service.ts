import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { StepExecutor } from './step-executor';
import { RequestInterceptor } from './request-interceptor';
import { BrowserAction } from './action-utils';
import { ClickHandler } from './handlers/click-handler.service';
import { ChangeHandler } from './handlers/change-handler.service';
import { HoverHandler } from './handlers/hover-handler.service';
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';

@Injectable()
export class ActionService {
  private stepExecutor: StepExecutor;

  constructor(
    private dataLayerService: DataLayerService,
    private changeHandler: ChangeHandler,
    private clickHandler: ClickHandler,
    private hoverHandler: HoverHandler,
    private requestInterceptor: RequestInterceptor,
    private fileService: FileService,
    private filePathService: FilePathService
  ) {
    this.stepExecutor = new StepExecutor(
      {
        [BrowserAction.CLICK]: this.clickHandler,
        [BrowserAction.CHANGE]: this.changeHandler,
        [BrowserAction.HOVER]: this.hoverHandler,
      },
      this.dataLayerService
    );
  }

  async performOperation(
    page: Page,
    projectName: string,
    eventId: string,
    application?: EventInspectionPresetDto['application']
  ) {
    const operation = await this.fileService.readJsonFile(
      await this.filePathService.getOperationFilePath(projectName, eventId)
    );
    if (!operation || !operation.steps) return;

    await this.requestInterceptor.setupInterception(page, projectName, eventId);
    let isLastStep = false;
    for (let i = 0; i < operation.steps.length; i++) {
      const step = operation.steps[i];

      if (i === operation.steps.length - 1) isLastStep = true;

      const state = {
        isFirstNavigation: true,
      };

      Logger.log(
        `Performing step ${i + 1} of ${operation.steps.length}`,
        `${ActionService.name}.${ActionService.prototype.performOperation.name}`
      );

      await this.stepExecutor.executeStep(
        page,
        step,
        projectName,
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
  }
}
