import { XpathChangeStrategy } from '../strategies/change-strategies/xpath-change-strategy.service';
import { PierceChangeStrategy } from '../strategies/change-strategies/pierce-change-strategy.service';
import { CSSChangeStrategy } from '../strategies/change-strategies/css-change-strategy.service';
import { AriaChangeStrategy } from '../strategies/change-strategies/aria-change-strategy.service';
import { Injectable, HttpException, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType, getSelectorType } from '../action-utils';
import { ActionHandler, getFirstSelector } from './utils';
import { ChangeStrategy } from '../strategies/change-strategies/utils';

@Injectable()
export class ChangeHandler implements ActionHandler {
  // constructor(private changeStrategies: { [key: string]: ChangeStrategy }) {}
  constructor(
    private ariaChangeStrategy: AriaChangeStrategy,
    private cSSChangeStrategy: CSSChangeStrategy,
    private pierceChangeStrategy: PierceChangeStrategy,
    private xpathChangeStrategy: XpathChangeStrategy
  ) {}

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
      // const strategy = this.changeStrategies[type];
      let strategy: ChangeStrategy;

      if (type === SelectorType.ARIA) {
        strategy = this.ariaChangeStrategy;
      } else if (
        type === SelectorType.CSSID ||
        type === SelectorType.CSSCLASS
      ) {
        strategy = this.cSSChangeStrategy;
      } else if (type === SelectorType.PIERCE) {
        strategy = this.pierceChangeStrategy;
      } else if (type === SelectorType.XPATH) {
        strategy = this.xpathChangeStrategy;
      }

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
