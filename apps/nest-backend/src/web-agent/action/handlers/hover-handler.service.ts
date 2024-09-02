import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Page } from 'puppeteer';
import { getSelectorType } from '../action-utils';
import { ActionHandler, getFirstSelector } from './utils';
import { HoverStrategyService } from '../strategies/hover-strategies/hover-strategy.service';

@Injectable()
export class HoverHandler implements ActionHandler {
  constructor(private hoverStrategyService: HoverStrategyService) {}

  // TODO: may need to follow the click handler logic
  // to switch between page service and evaluate service under different domains

  async handle(
    page: Page,
    projectName: string,
    title: string,
    step: any,
    isLastStep: boolean
  ): Promise<void> {
    let hoveredSuccessfully = false;

    for (const selectorArray of step.selectors) {
      try {
        if (
          await this.hoverElement(
            page,
            projectName,
            title,
            getFirstSelector(selectorArray)
          )
        ) {
          hoveredSuccessfully = true;
          Logger.log(
            getFirstSelector(selectorArray),
            `${HoverHandler.name}.${HoverHandler.prototype.handle.name}`
          );
          break; // Exit the loop as soon as one selector works
        }
      } catch (error) {
        Logger.error(
          error,
          `${HoverHandler.name}.${HoverHandler.prototype.handle.name}`
        );
      }
    }

    if (!hoveredSuccessfully) {
      // early exit
      throw new HttpException(
        `Failed to hover. None of the selectors worked for action ${step.target}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async hoverElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout = 10000
  ): Promise<boolean | undefined> {
    try {
      const selectorType = getSelectorType(selector);
      if (!selectorType) {
        throw new HttpException(
          `Selector type not found for selector ${selector}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      return await this.hoverStrategyService.hoverElement(
        page,
        projectName,
        title,
        selector,
        selectorType,
        timeout
      );
    } catch (error) {
      Logger.error(
        error,
        `${HoverHandler.name}.${HoverHandler.prototype.hoverElement.name}`
      );
    }
  }
}
