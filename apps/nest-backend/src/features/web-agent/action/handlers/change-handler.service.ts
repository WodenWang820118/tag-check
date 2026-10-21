import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { Page } from 'puppeteer';
import {
  ActionHandler,
  getFirstSelector,
  preferSelector,
  STEP_SELECTOR_TIMEOUT_MS,
  waitForAnySelector
} from './utils';
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
    _isLastClick?: boolean,
    timeout = 3000
  ): Promise<void> {
    const candidates = (step.selectors ?? []).map(getFirstSelector);
    if (candidates.length === 0) {
      return;
    }
    const value = step.value;
    // Give slow pages time to render the field. Typing does not need it to be
    // visible (page.type fills hidden fields too), only present.
    const waitTimeout = step.timeout ?? STEP_SELECTOR_TIMEOUT_MS;
    const present = await waitForAnySelector(page, candidates, {
      timeout: waitTimeout,
      visible: false
    });
    if (!present) {
      throw new NotFoundException(
        `None of the selectors appeared within ${waitTimeout} ms: ${candidates.join(', ')}`
      );
    }

    // Start with the selector that appeared; fall back to the others.
    let lastError: unknown;
    for (const selector of preferSelector(candidates, present)) {
      try {
        if (
          await this.changeElement(
            page,
            projectName,
            eventId,
            selector,
            value,
            timeout
          )
        ) {
          return;
        }
      } catch (error) {
        lastError = error;
        this.logger.warn(`Failed to change using selector ${selector}`);
      }
    }
    throw (
      lastError ??
      new InternalServerErrorException(
        `Failed to change any of: ${candidates.join(', ')}`
      )
    );
  }

  async changeElement(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    // ChangeStrategyService rejects a missing value itself.
    value: string | undefined,
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
