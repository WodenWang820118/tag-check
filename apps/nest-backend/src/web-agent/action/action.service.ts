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

@Injectable()
export class ActionService {
  private stepExecutor: StepExecutor;

  constructor(
    private dataLayerService: DataLayerService,
    private changeHandler: ChangeHandler,
    private clickHandler: ClickHandler,
    private hoverHandler: HoverHandler,
    private requestInterceptor: RequestInterceptor
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
    operation: any,
    application?: EventInspectionPresetDto['application']
  ) {
    if (!operation || !operation.steps) return;

    await this.requestInterceptor.setupInterception(
      page,
      projectName,
      operation
    );
    let isLastStep = false;
    for (let i = 0; i < operation.steps.length; i++) {
      const step = operation.steps[i];

      if (i === operation.steps.length - 1) isLastStep = true;

      const state = {
        isFirstNavigation: true,
      };

      Logger.log(
        `Performing step ${i + 1} of ${operation.steps.length}`,
        'ActionService.performOperation'
      );

      await this.stepExecutor.executeStep(
        page,
        step,
        projectName,
        operation.title,
        state,
        isLastStep,
        application
      );
    }

    Logger.log(
      'Operation performed successfully',
      'ActionService.performOperation'
    );
  }
}
