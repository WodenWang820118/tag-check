import { Injectable, Logger, HttpException } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType, getSelectorType } from '../action-utils';
import { ActionHandler, getFirstSelector } from './utils';
import { HoverStrategy } from '../strategies/hover-strategies/utils';
import { CSSHoverStrategy } from '../strategies/hover-strategies/css-hover-strategy.service';
import { PierceHoverStrategy } from '../strategies/hover-strategies/pierce-hover-strategy.service';
import { XPathHoverStrategy } from '../strategies/hover-strategies/xpath-hover-strategy.service';
import { TextHoverStrategy } from '../strategies/hover-strategies/text-hover-strategy.service';
import { AriaHoverStrategy } from '../strategies/hover-strategies/aria-hover-strategy.service';

@Injectable()
export class HoverHandler implements ActionHandler {
  constructor(
    private ariaHoverStrategy: AriaHoverStrategy,
    private cSSHoverStrategy: CSSHoverStrategy,
    private pierceHoverStrategy: PierceHoverStrategy,
    private textHoverStrategy: TextHoverStrategy,
    private xpathHoverStrategy: XPathHoverStrategy
  ) {}

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
      let strategy: HoverStrategy;

      if (type === SelectorType.ARIA) {
        strategy = this.ariaHoverStrategy;
      } else if (
        type === SelectorType.CSSID ||
        type === SelectorType.CSSCLASS
      ) {
        strategy = this.cSSHoverStrategy;
      } else if (type === SelectorType.PIERCE) {
        strategy = this.pierceHoverStrategy;
      } else if (type === SelectorType.TEXT) {
        strategy = this.textHoverStrategy;
      } else if (type === SelectorType.XPATH) {
        strategy = this.xpathHoverStrategy;
      } else if (!strategy) {
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
