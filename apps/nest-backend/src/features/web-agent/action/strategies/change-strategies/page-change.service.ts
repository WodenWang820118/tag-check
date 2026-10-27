import { Injectable, Logger } from '@nestjs/common';
import { targetFrame, type QueryRoot } from '../../handlers/frame';
import { ChangeOperation } from './utils';
import { withTimeout } from '../with-timeout';

/**
 * Changes an element through the page: page.select() for a select element,
 * page.type() otherwise. Works with CSS selectors only; for other selector
 * types the tag check fails and the strategy falls back to an element handle.
 */
@Injectable()
export class PageChangeService implements ChangeOperation {
  private readonly logger = new Logger(PageChangeService.name);
  async operate(
    page: QueryRoot,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      if (!value) {
        this.logger.error('Value is required to change the element');
        return false;
      }

      // A source string: swc would compile a function to ES5 for the page,
      // which has none of the bundle's helpers (see AGENTS.md). The same
      // string runs in a frame.
      const frame = targetFrame(page);
      const isSelect = await frame.evaluate(
        `(() => {
          const element = document.querySelector(${JSON.stringify(selector)});
          return !!(element && element.tagName.toLowerCase() === "select");
        })()`
      );

      if (isSelect) {
        this.logger.log('Selecting the select element');
        await withTimeout(
          frame.select(selector, value),
          timeout,
          'Timeout exceeded'
        );
      } else {
        this.logger.log('Typing the input element');
        await withTimeout(
          frame.type(selector, value),
          timeout,
          'Timeout exceeded'
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to change element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
