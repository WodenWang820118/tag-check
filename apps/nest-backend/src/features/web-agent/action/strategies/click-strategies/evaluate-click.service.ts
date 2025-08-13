import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ClickOperation } from './utils';
import { ActionUtilsService } from '../../action-utils/action-utils.service';

@Injectable()
export class EvaluateClickService implements ClickOperation {
  private readonly logger = new Logger(EvaluateClickService.name);
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
          `Failed to click on element with selector "${selector}": Element not found`
        );
        return false;
      }

      await Promise.race([
        page.evaluate(async () => {
          await element.click();
        }, selector),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout exceeded Evaluation Clicking')),
            timeout
          )
        )
      ]);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to click on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
