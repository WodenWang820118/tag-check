import { Page } from 'puppeteer';
import { ChangeStrategy } from './strategies/change-strategy';

import { HoverStrategy } from './strategies/hover-strategy';
import { Logger, HttpException, Injectable } from '@nestjs/common';
import { getSelectorType } from './action-utilities';
import { UtilitiesService } from '../utilities/utilities.service';
import { ClickStrategy } from './strategies/click-strategies/utils';

export interface ActionHandler {
  handle(
    page: Page,
    title: string,
    step: any,
    isLastStep: boolean
  ): Promise<void>;
}

function getFirstSelector(selectorGroup: string | string[]): string {
  return Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
}

@Injectable()
export class ClickHandler implements ActionHandler {
  constructor(
    private clickStrategies: { [key: string]: ClickStrategy },
    private utilitiesService: UtilitiesService
  ) {}

  async handle(
    page: Page,
    title: string,
    step: any,
    isLastStep: boolean
  ): Promise<void> {
    // Logic of handleClick
    let clickedSuccessfully = false;
    const isSelectPromotion = title === 'select_promotion';
    const isSelectItem = title === 'select_item';
    let preventNavigation = false;

    for (const selector of step.selectors) {
      // try {
      //   await this.utilitiesService.scrollIntoViewIfNeeded(
      //     Array.isArray(selector) ? selector : [selector],
      //     page,
      //     500
      //   );
      // } catch (error) {
      //   Logger.error(error.mssage, 'Utilities.scrollIntoViewIfNeeded');
      // }

      if (
        step.type === 'click' &&
        (isSelectItem || isSelectPromotion) &&
        isLastStep
      )
        preventNavigation = true;

      if (
        await this.clickElement(
          page,
          getFirstSelector(selector),
          0,
          preventNavigation
        )
      ) {
        clickedSuccessfully = true;
        Logger.log(getFirstSelector(selector), 'ClickHandler.handle');
        break; // Exit the loop as soon as one selector works
      }
    }

    if (!clickedSuccessfully) {
      throw new HttpException(
        `Failed to click. None of the selectors worked for action ${step.target}`,
        500
      );
    }
  }

  async clickElement(
    page: Page,
    selector: string,
    timeout = 3000,
    preventNavigation = false
  ): Promise<boolean> {
    try {
      const type = getSelectorType(selector);
      const strategy = this.clickStrategies[type];

      if (!strategy) {
        Logger.error(
          `No strategy found for selector type ${type}`,
          'ClickHandler.clickElement'
        );
        return false;
      }
      Logger.log(selector, 'ClickHandler.clickElement');
      return await strategy.clickElement(
        page,
        selector,
        timeout,
        preventNavigation
      );
    } catch (error) {
      Logger.error(error.message, 'ClickHandler.clickElement');
    }
  }
}

@Injectable()
export class ChangeHandler implements ActionHandler {
  constructor(private changeStrategies: { [key: string]: ChangeStrategy }) {}

  async handle(
    page: Page,
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
    selector: string,
    value: string,
    timeout = 1000
  ): Promise<boolean> {
    try {
      const type = getSelectorType(selector);
      const strategy = this.changeStrategies[type];

      if (!strategy) {
        Logger.error(
          `No strategy found for selector type ${type}`,
          'ChangeHandler.changeElement'
        );
        return false;
      }
      Logger.log(selector, 'ChangeHandler.changeElement');
      return await strategy.changeElement(page, selector, value, timeout);
    } catch (error) {
      Logger.error(error.message, 'ChangeHandler.changeElement');
    }
  }
}

@Injectable()
export class HoverHandler implements ActionHandler {
  constructor(private hoverStrategies: { [key: string]: HoverStrategy }) {}

  async handle(
    page: Page,
    title: string,
    step: any,
    isLastStep: boolean
  ): Promise<void> {
    Logger.log('handleHover');
    const selectors = step.selectors;
    let hoveredSuccessfully = false;

    for (const selectorArray of selectors) {
      try {
        if (await this.hoverElement(page, getFirstSelector(selectorArray))) {
          hoveredSuccessfully = true;
          Logger.log(
            getFirstSelector(selectorArray),
            'HoverHandler.handleHover'
          );
          break; // Exit the loop as soon as one selector works
        }
      } catch (error) {
        Logger.error(error.message, 'HoverHandler.handleHover');
      }
    }

    if (!hoveredSuccessfully) {
      // early exit
      throw new HttpException(
        `Failed to hover. None of the selectors worked for action ${step.target}`,
        500
      );
    }
  }

  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    try {
      const type = getSelectorType(selector);
      const strategy = this.hoverStrategies[type];

      if (!strategy) {
        Logger.error(
          `No strategy found for selector type ${type}`,
          'HoverHandler.hoverElement'
        );
        return false;
      }

      return await strategy.hoverElement(page, selector, timeout);
    } catch (error) {
      Logger.error(error.message, 'HoverHandler.hoverElement');
    }
  }
}
