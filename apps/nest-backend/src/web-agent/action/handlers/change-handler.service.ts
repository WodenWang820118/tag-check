import { Injectable, HttpException, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { getSelectorType } from '../action-utils';
import { ActionHandler, getFirstSelector } from './utils';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';

@Injectable()
export class ChangeHandler implements ActionHandler {
  constructor(private changeStrategyService: ChangeStrategyService) {}

  // TODO: may need to follow the click handler logic
  // to switch between page service and evaluate service under different domains

  async handle(
    page: Page,
    projectName: string,
    title: string,
    step: any,
    isLastStep: boolean,
    timeout = 3000
  ): Promise<void> {
    const selectors = step.selectors;
    const value = step.value;

    for (const selector of selectors) {
      try {
        if (
          await this.changeElement(
            page,
            projectName,
            title,
            getFirstSelector(selector),
            value,
            timeout
          )
        ) {
          break;
        }
      } catch (error) {
        throw new HttpException(
          `Failed to change value with selector ${selector}. Reason: ${error.message}`,
          500
        );
      }
    }
  }

  async changeElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    try {
      return await this.changeStrategyService.changeElement(
        page,
        projectName,
        title,
        selector,
        getSelectorType(selector),
        value,
        timeout
      );
    } catch (error) {
      Logger.error(error.message, 'ChangeHandler.changeElement');
    }
  }
}
