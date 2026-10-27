import { Injectable, Logger } from '@nestjs/common';
import type { QueryRoot } from '../../handlers/frame';
import { ClickOperation } from './utils';
import { ActionUtilsService } from '../../action-utils/action-utils.service';
import { withTimeout } from '../with-timeout';

/**
 * Clicks with element.click() inside the page: a DOM click that reaches
 * elements covered by others or outside the viewport.
 */
@Injectable()
export class EvaluateClickService implements ClickOperation {
  private readonly logger = new Logger(EvaluateClickService.name);
  constructor(private readonly actionUtilsService: ActionUtilsService) {}
  async operate(
    page: QueryRoot,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      const element = await this.actionUtilsService.getElement(
        page,
        selectorType,
        selector
      );
      if (!element) {
        this.logger.error(
          `Failed to click on element with selector "${selector}": Element not found`
        );
        return false;
      }

      try {
        // Helper-free on purpose: swc compiles this function to ES5 for the
        // page, which has none of the bundle's helpers (see AGENTS.md).
        await withTimeout(
          element.evaluate((el) => {
            (el as HTMLElement).click();
          }),
          timeout,
          'Timeout exceeded Evaluation Clicking'
        );
      } finally {
        await element.dispose().catch((error) => {
          this.logger.warn(
            `Failed to dispose clicked element handle "${selector}": ${error}`
          );
        });
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to click on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
