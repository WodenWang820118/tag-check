import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { StrategyManager } from './strategies/strategy-manager';
import { StepExecutor } from './step-executor';
import { ClickHandler, ChangeHandler, HoverHandler } from './action-handlers';
import { RequestInterceptor } from './request-interceptor';
import { BrowserAction } from './action-utilities';
import { UtilitiesService } from '../utilities/utilities.service';

@Injectable()
export class ActionService {
  private strategyManager: StrategyManager;
  private stepExecutor: StepExecutor;
  private requestInterceptor: RequestInterceptor;

  constructor(
    private dataLayerService: DataLayerService,
    private utilitiesService: UtilitiesService
  ) {
    this.strategyManager = new StrategyManager();
    this.requestInterceptor = new RequestInterceptor(this.dataLayerService);
    this.stepExecutor = new StepExecutor(
      {
        [BrowserAction.CLICK]: new ClickHandler(
          this.strategyManager.clickStrategies,
          this.utilitiesService
        ),
        [BrowserAction.CHANGE]: new ChangeHandler(
          this.strategyManager.changeStrategies
        ),
        [BrowserAction.HOVER]: new HoverHandler(
          this.strategyManager.hoverStrategies
        ),
      },
      this.dataLayerService
    );
  }

  async performOperation(page: Page, projectName: string, operation: any) {
    if (!operation || !operation.steps) return;

    // intercept specific requests that update dataLayer and navigate to other pages
    await this.requestInterceptor.interceptRequest(
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

      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        this.stepExecutor.executeStep(
          page,
          step,
          projectName,
          operation.title,
          state,
          isLastStep
        ),
      ]);
    }

    Logger.log(
      'Operation performed successfully',
      'ActionService.performOperation'
    );
  }
}
