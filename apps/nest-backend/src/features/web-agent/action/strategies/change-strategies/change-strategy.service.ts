import { Injectable, Logger } from '@nestjs/common';
import { EvaluateChangeService } from './evaluate-change.service';
import { PageChangeService } from './page-change.service';
import { ChangeStrategy } from './utils';
import type { QueryRoot } from '../../handlers/frame';

/**
 * Types a value into a field or selects an option, first through the page
 * (page.type() / page.select() with a CSS selector), then through an element
 * handle, which also resolves XPath, text, ARIA and pierce selectors.
 */
@Injectable()
export class ChangeStrategyService implements ChangeStrategy {
  private readonly logger = new Logger(ChangeStrategyService.name);
  constructor(
    private readonly pageChangeService: PageChangeService,
    private readonly evaluateChangeService: EvaluateChangeService
  ) {}

  /**
   * Resolves true once either method changed the element, false when
   * neither did or `value` is empty. Never throws.
   */
  async changeElement(
    page: QueryRoot,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 10000
  ): Promise<boolean> {
    try {
      if (!value) {
        this.logger.error('Value is required to change the element');
        return false;
      }

      return (
        (await this.pageChangeService.operate(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          value,
          timeout
        )) ||
        (await this.evaluateChangeService.operate(
          page,
          projectName,
          eventId,
          selector,
          selectorType,
          value,
          timeout
        ))
      );
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
