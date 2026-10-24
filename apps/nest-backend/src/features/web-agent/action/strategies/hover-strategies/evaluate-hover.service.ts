import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ActionUtilsService } from '../../action-utils/action-utils.service';
import { withTimeout } from '../with-timeout';

/**
 * Hovers through an element handle, which resolves every selector type.
 * Resolves true once the mouse is over the element, false when it was not
 * found, failed or timed out; it does not throw.
 */
@Injectable()
export class EvaluateHoverService {
  private readonly logger = new Logger(EvaluateHoverService.name);
  constructor(private readonly actionUtilsService: ActionUtilsService) {}
  async operate(
    page: Page,
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
          `Failed to hover on element with selector "${selector}": Element not found`
        );
        return false;
      }

      try {
        await withTimeout(element.hover(), timeout, 'Timeout exceeded');
      } finally {
        await element.dispose().catch((error) => {
          this.logger.warn(
            `Failed to dispose hovered element handle "${selector}": ${error}`
          );
        });
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to hover on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
