/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ActionHandler, getFirstSelector } from './utils';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';
import { ActionUtilsService } from './../action-utils/action-utils.service';

@Injectable()
export class ChangeHandler implements ActionHandler {
  constructor(
    private changeStrategyService: ChangeStrategyService,
    private actionUtilsService: ActionUtilsService
  ) {}

  // TODO: may need to follow the click handler logic
  // to switch between page service and evaluate service under different domains

  async handle(
    page: Page,
    projectName: string,
    eventId: string,
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
            eventId,
            getFirstSelector(selector),
            value,
            timeout
          )
        ) {
          break;
        }
      } catch (error) {
        throw new HttpException(
          `Failed to change value with selector ${selector}. Reason: ${error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async changeElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean | undefined> {
    try {
      const selectorType = this.actionUtilsService.getSelectorType(selector);
      if (!selectorType) {
        Logger.error(
          'Selector type is required to change the element',
          `${ChangeHandler.name}.${ChangeHandler.prototype.changeElement.name}`
        );
        return false;
      }
      return await this.changeStrategyService.changeElement(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        value,
        timeout
      );
    } catch (error) {
      Logger.error(
        error,
        `${ChangeHandler.name}.${ChangeHandler.prototype.changeElement.name}`
      );
    }
  }
}
