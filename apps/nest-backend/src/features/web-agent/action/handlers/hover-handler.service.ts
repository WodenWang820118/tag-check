 
 
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Page } from 'puppeteer';
import { ActionHandler, getFirstSelector } from './utils';
import { HoverStrategyService } from '../strategies/hover-strategies/hover-strategy.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import { Step } from '@utils';

@Injectable()
export class HoverHandler implements ActionHandler {
  private readonly logger = new Logger(HoverHandler.name);
  constructor(
    private readonly hoverStrategyService: HoverStrategyService,
    private readonly actionUtilsService: ActionUtilsService
  ) {}

  async handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: Step,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLastStep: boolean
  ): Promise<void> {
    let hoveredSuccessfully = false;

    for (const selectorArray of step.selectors) {
      const selector = getFirstSelector(selectorArray);
      try {
        // Attempt to hover over the element with the given selector
        const hovered = await this.hoverElement(
          page,
          projectName,
          eventId,
          selector
        );
        if (hovered) {
          hoveredSuccessfully = true;
          this.logger.log(`Hovered successfully using selector: ${selector}`);
          break; // Exit the loop as soon as one selector works
        }
      } catch (error) {
        this.logger.warn(
          `Failed to hover using selector "${selector}": ${error}`
        );
      }
    }

    if (!hoveredSuccessfully) {
      throw new InternalServerErrorException(
        `Failed to hover. None of the selectors worked for action "${step.target}"`
      );
    }
  }

  private async hoverElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    timeout = 10000
  ): Promise<boolean> {
    try {
      // Wait for the selector to be visible on the page
      await page.waitForSelector(selector, { timeout, visible: true });

      const selectorType = this.actionUtilsService.getSelectorType(selector);
      if (!selectorType) {
        throw new HttpException(
          `Selector type not found for selector "${selector}"`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Call the hover strategy service to perform the hover action
      const result = await this.hoverStrategyService.hoverElement(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        timeout
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error hovering element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
