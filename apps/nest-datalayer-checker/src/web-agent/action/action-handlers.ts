import { Page } from 'puppeteer';
import { ChangeStrategy } from './strategies/change-strategy';
import { ClickStrategy } from './strategies/click-strategy';
import { HoverStrategy } from './strategies/hover-strategy';
import { Logger, HttpException } from '@nestjs/common';
import { getSelectorType } from './action-utilities';

export interface ActionHandler {
  handle(page: Page, step: any): Promise<void>;
}

function getFirstSelector(selectorGroup: string | string[]): string {
  return Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
}

export class ClickHandler implements ActionHandler {
  constructor(private clickStrategies: { [key: string]: ClickStrategy }) {}

  async handle(page: Page, step: any): Promise<void> {
    // Logic of handleClick
    Logger.log('click');
    let clickedSuccessfully = false;

    for (const selectorGroup of step.selectors) {
      // TODO: Scroll into view if needed
      // try {
      //   await this.utilitiesService.scrollIntoViewIfNeeded(
      //     Array.isArray(selectorGroup) ? selectorGroup[0] : [selectorGroup],
      //     page,
      //     20000
      //   );
      // } catch (error) {
      //   console.error('scrollIntoViewIfNeeded error: ', error);
      // }

      if (await this.clickElement(page, getFirstSelector(selectorGroup))) {
        clickedSuccessfully = true;
        Logger.log('click success! ', getFirstSelector(selectorGroup));
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
    timeout = 1000
  ): Promise<boolean> {
    const type = getSelectorType(selector);
    const strategy = this.clickStrategies[type];

    if (!strategy) {
      Logger.error(`No strategy found for selector type ${type}`);
      return false;
    }
    Logger.log('clickElement: ', selector);
    return await strategy.clickElement(page, selector, timeout);
  }
}

export class ChangeHandler implements ActionHandler {
  constructor(private changeStrategies: { [key: string]: ChangeStrategy }) {}

  async handle(page: Page, step: any, timeout = 1000): Promise<void> {
    const selectors = step.selectors;
    const value = step.value;

    for (const selectorArray of selectors) {
      try {
        if (await this.changeElement(page, selectorArray[0], value, timeout)) {
          break;
        }
      } catch (error) {
        throw new HttpException(
          `Failed to change value with selector ${selectorArray[0]}. Reason: ${error.message}`,
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
    const type = getSelectorType(selector);
    const strategy = this.changeStrategies[type];

    if (!strategy) {
      Logger.error(`No strategy found for selector type ${type}`);
      return false;
    }

    return await strategy.changeElement(page, selector, value, timeout);
  }
}

export class HoverHandler implements ActionHandler {
  constructor(private hoverStrategies: { [key: string]: HoverStrategy }) {}

  async handle(page: Page, step: any): Promise<void> {
    Logger.log('handleHover');
    const selectors = step.selectors;
    let hoveredSuccessfully = false;

    for (const selectorArray of selectors) {
      try {
        if (await this.hoverElement(page, getFirstSelector(selectorArray))) {
          hoveredSuccessfully = true;
          Logger.log('hover success! ', getFirstSelector(selectorArray));
          break; // Exit the loop as soon as one selector works
        }
      } catch (error) {
        Logger.error('hoverElement error ', error);
      }
    }

    if (!hoveredSuccessfully) {
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
    const type = getSelectorType(selector);
    const strategy = this.hoverStrategies[type];

    if (!strategy) {
      Logger.error(`No strategy found for selector type ${type}`);
      return false;
    }

    return await strategy.hoverElement(page, selector, timeout);
  }
}
