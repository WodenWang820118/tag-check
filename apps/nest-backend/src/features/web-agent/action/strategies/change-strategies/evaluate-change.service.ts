import { Injectable, Logger } from '@nestjs/common';
import { ElementHandle, Page } from 'puppeteer';
import { ChangeOperation } from './utils';
import { ActionUtilsService } from '../../action-utils/action-utils.service';
import { withTimeout } from '../with-timeout';

/**
 * Changes an element through an element handle, which resolves every
 * selector type: select() for a select element, type() for an input or a
 * textarea. Other elements are not supported.
 */
@Injectable()
export class EvaluateChangeService implements ChangeOperation {
  private readonly logger = new Logger(EvaluateChangeService.name);
  constructor(private readonly actionUtilsService: ActionUtilsService) {}
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 5000
  ): Promise<boolean> {
    if (!value) {
      this.logger.error('Value is required to change the element');
      return false;
    }

    try {
      const element = await this.actionUtilsService.getElement(
        page,
        selectorType,
        selector
      );

      if (!element) {
        this.logger.error(
          `Failed to change element with selector "${selector}": Element not found`
        );
        return false;
      }
      try {
        await withTimeout(
          this.change(element, value),
          timeout,
          'Timeout exceeded Changing'
        );
      } finally {
        // The handle would keep the node alive until the page navigates.
        await element.dispose().catch((error) => {
          this.logger.warn(
            `Failed to dispose changed element handle "${selector}": ${error}`
          );
        });
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector "${selector}": ${error}`
      );
      return false;
    }
  }

  private async change(
    element: ElementHandle<Element>,
    value: string
  ): Promise<void> {
    const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
    if (tagName === 'select') {
      await element.select(value);
    } else if (tagName === 'input' || tagName === 'textarea') {
      await element.type(value);
    } else {
      throw new Error(`Unsupported element type: ${tagName}`);
    }
  }
}
