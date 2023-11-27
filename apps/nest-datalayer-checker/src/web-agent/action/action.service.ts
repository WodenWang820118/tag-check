import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { StepExecutor } from './step-executor';
import { RequestInterceptor } from './request-interceptor';
import { BrowserAction } from './action-utils';
import { UtilitiesService } from '../utilities/utilities.service';
import { ClickHandler } from './handlers/click-handler.service';
import { ChangeHandler } from './handlers/change-handler.service';
import { HoverHandler } from './handlers/hover-handler.service';

@Injectable()
export class ActionService {
  // private strategyManager: StrategyManager;
  private stepExecutor: StepExecutor;
  private requestInterceptor: RequestInterceptor;

  constructor(
    private dataLayerService: DataLayerService,
    private utilitiesService: UtilitiesService,
    private changeHandler: ChangeHandler,
    private clickHandler: ClickHandler,
    private hoverHandler: HoverHandler
  ) {
    // this.strategyManager = new StrategyManager();
    this.requestInterceptor = new RequestInterceptor(this.dataLayerService);
    this.stepExecutor = new StepExecutor(
      {
        [BrowserAction.CLICK]: this.clickHandler,
        [BrowserAction.CHANGE]: this.changeHandler,
        [BrowserAction.HOVER]: this.hoverHandler,
      },
      this.dataLayerService
    );
  }

  async performOperation(page: Page, projectName: string, operation: any) {
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

      await this.stepExecutor.executeStep(
        page,
        step,
        projectName,
        operation.title,
        state,
        isLastStep
      );
    }

    Logger.log(
      'Operation performed successfully',
      'ActionService.performOperation'
    );
  }
}
