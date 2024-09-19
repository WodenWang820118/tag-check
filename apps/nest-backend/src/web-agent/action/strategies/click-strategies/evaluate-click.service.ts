import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ClickOperation } from './utils';
import { ActionUtilsService } from '../../action-utils/action-utils.service';

@Injectable()
export class EvaluateClickService implements ClickOperation {
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
          element?.click();
        }, selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      Logger.error(
        error,
        `${EvaluateClickService.name}.${EvaluateClickService.prototype.operate.name}`
      );
      return false;
    }
  }
}
