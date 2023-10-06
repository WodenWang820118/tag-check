import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { StrategyManager } from './strategies/strategy-manager';
import { StepExecutor } from './step-executor';
import { ClickHandler, ChangeHandler, HoverHandler } from './action-handlers';
import { BrowserAction } from './action-utilities';
import { WebMonitoringService } from '../web-monitoring/web-monitoring.service';
import { Operation } from '../../shared/interfaces/recording.interface';

@Injectable()
export class ActionService {
  private strategyManager: StrategyManager;
  private stepExecutor: StepExecutor;

  constructor(
    private dataLayerService: DataLayerService,
    private webMonitoringService: WebMonitoringService
  ) {
    this.strategyManager = new StrategyManager();
    this.stepExecutor = new StepExecutor(
      {
        [BrowserAction.CLICK]: new ClickHandler(
          this.strategyManager.clickStrategies
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

  async performOperation(
    page: Page,
    projectName: string,
    operation: Operation
  ) {
    if (!operation || !operation.steps) return;

    // intercept specific requests that update dataLayer and navigate to other pages
    await this.webMonitoringService.interceptRequest(
      page,
      projectName,
      operation
    );

    for (const step of operation.steps) {
      const state = {
        isFirstNavigation: true,
      };
      await this.stepExecutor.executeStep(
        page,
        step,
        projectName,
        operation.title,
        state
      );
    }

    Logger.log('performOperation completes');
  }
}
