import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { Page } from 'puppeteer';
import { resolveStepFrame, type QueryRoot } from './frame';
import {
  ActionHandler,
  preferSelector,
  STEP_SELECTOR_TIMEOUT_MS,
  toPuppeteerSelector,
  waitForAnySelector
} from './utils';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';
import { ActionUtilsService } from './../action-utils/action-utils.service';
import { Step } from '@utils';
import { StepElementNotFoundError } from '../step-failure/step-element-not-found.error';

/**
 * Replays a change step: types the step's value into a field or selects it
 * in a select element, with the first of its selectors that works.
 */
@Injectable()
export class ChangeHandler implements ActionHandler {
  private readonly logger = new Logger(ChangeHandler.name);
  constructor(
    private readonly changeStrategyService: ChangeStrategyService,
    private readonly actionUtilsService: ActionUtilsService
  ) {}

  // Unlike ClickHandler, this needs no GTM Preview switch: typing and
  // selecting reach the site's tab while Tag Assistant's tab is in front
  // (checked headless and headful), and ChangeStrategyService already falls
  // back from page.type() to an element handle.
  async handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: Step,
    _isLastClick?: boolean,
    timeout = 3000
  ): Promise<void> {
    const candidates = (step.selectors ?? []).map(toPuppeteerSelector);
    if (candidates.length === 0) {
      return;
    }
    const value = step.value;
    // Give slow pages time to render the field. Typing does not need it to be
    // visible (page.type fills hidden fields too), only present.
    const waitTimeout = step.timeout ?? STEP_SELECTOR_TIMEOUT_MS;
    const root = await resolveStepFrame(page, step.frame, waitTimeout);
    const present = await waitForAnySelector(root, candidates, {
      timeout: waitTimeout,
      visible: false
    });
    if (!present) {
      throw new StepElementNotFoundError(
        `None of the selectors appeared within ${waitTimeout} ms: ${candidates.join(', ')}`,
        candidates,
        waitTimeout,
        HttpStatus.NOT_FOUND
      );
    }

    // Start with the selector that appeared; fall back to the others.
    let lastError: unknown;
    for (const selector of preferSelector(candidates, present)) {
      try {
        if (
          await this.changeElement(
            root,
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
    page: QueryRoot,
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
