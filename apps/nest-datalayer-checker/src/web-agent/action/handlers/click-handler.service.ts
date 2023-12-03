import { Injectable, Logger, HttpException } from '@nestjs/common';
import { Page } from 'puppeteer';
import { UtilitiesService } from '../../utilities/utilities.service';
import { SelectorType, getSelectorType } from '../action-utils';
import { ClickStrategy } from '../strategies/click-strategies/utils';
import { ActionHandler, getFirstSelector } from './utils';
import { AriaClickStrategy } from '../strategies/click-strategies/aria-click-strategy.service';
import { CSSClickStrategy } from '../strategies/click-strategies/css-click-strategy.service';
import { PierceClickStrategy } from '../strategies/click-strategies/pierce-click-strategy.service';
import { TextClickStrategy } from '../strategies/click-strategies/text-click-strategy.service';
import { XPathClickStrategy } from '../strategies/click-strategies/xpath-click-strategy.service';
import { ProjectService } from '../../../shared/project/project.service';
@Injectable()
export class ClickHandler implements ActionHandler {
  constructor(
    private ariaClickStrategy: AriaClickStrategy,
    private cSSClickStrategy: CSSClickStrategy,
    private pierceClickStrategy: PierceClickStrategy,
    private textClickStrategy: TextClickStrategy,
    private xpathClickStrategy: XPathClickStrategy,
    private utilitiesService: UtilitiesService,
    private projectService: ProjectService
  ) {}

  async handle(
    page: Page,
    projectName: string,
    title: string,
    step: any,
    isLastStep: boolean
  ): Promise<void> {
    // Logic of handleClick
    let clickedSuccessfully = false;
    const preventNavigationEvents =
      this.projectService.settings.preventNavigationEvents;
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
        preventNavigationEvents.includes(title) &&
        isLastStep
      )
        preventNavigation = true;

      if (
        await this.clickElement(
          page,
          projectName,
          title,
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
    projectName: string,
    title: string,
    selector: string,
    timeout = 3000,
    preventNavigation = false
  ): Promise<boolean> {
    try {
      const type = getSelectorType(selector);
      let strategy: ClickStrategy;

      if (type === SelectorType.ARIA) {
        strategy = this.ariaClickStrategy;
      } else if (
        type === SelectorType.CSSID ||
        type === SelectorType.CSSCLASS
      ) {
        strategy = this.cSSClickStrategy;
      } else if (type === SelectorType.PIERCE) {
        strategy = this.pierceClickStrategy;
      } else if (type === SelectorType.TEXT) {
        strategy = this.textClickStrategy;
      } else if (type === SelectorType.XPATH) {
        strategy = this.xpathClickStrategy;
      } else if (!strategy) {
        Logger.error(
          `No strategy found for selector type ${type}`,
          'ClickHandler.clickElement'
        );
        return false;
      }
      Logger.log(selector, 'ClickHandler.clickElement');
      return await strategy.clickElement(
        page,
        projectName,
        title,
        selector,
        timeout,
        preventNavigation
      );
    } catch (error) {
      Logger.error(error.message, 'ClickHandler.clickElement');
    }
  }
}
