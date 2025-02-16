/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Page } from 'puppeteer';
import { ActionHandler, getFirstSelector } from './utils';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';
import { ActionUtilsService } from './../action-utils/action-utils.service';
import { Step } from '@utils';

@Injectable()
export class ChangeHandler implements ActionHandler {
  private readonly logger = new Logger(ChangeHandler.name);
  constructor(
    private readonly changeStrategyService: ChangeStrategyService,
    private readonly actionUtilsService: ActionUtilsService
  ) {}

  // TODO: may need to follow the click handler logic
  // to switch between page service and evaluate service under different domains

  async handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: Step,
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
        if (error instanceof NotFoundException) {
          throw error;
        }
        if (error instanceof InternalServerErrorException) {
          throw error;
        }
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
  ): Promise<boolean> {
    try {
      const selectorType = this.actionUtilsService.getSelectorType(selector);
      if (!selectorType) {
        throw new Error('Invalid selector type');
      }
      const result = await this.changeStrategyService.changeElement(
        page,
        projectName,
        eventId,
        selector,
        selectorType,
        value,
        timeout
      );
      if (!result) {
        throw new NotFoundException(
          `Element with selector ${selector} not found`
        );
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector ${selector}. Reason: ${error}`
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to change element with selector ${selector}. Reason: ${error}`
      );
    }
  }
}
