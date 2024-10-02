import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ActionUtilsService } from '../../action-utils/action-utils.service';

@Injectable()
export class EvaluateHoverService {
  private readonly logger = new Logger(EvaluateHoverService.name);
  constructor(private actionUtilsService: ActionUtilsService) {}
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      const element = (await this.actionUtilsService.getElement(
        page,
        selectorType,
        selector
      )) as HTMLElement;

      await Promise.race([
        page.evaluate((sel) => {
          element?.focus();
        }, selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to hover on element with selector "${selector}": ${error}`
      );
      return false;
    }
  }
}
