import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { getElement } from '../../action-utils';
import { ClickOperation } from './utils';

@Injectable()
export class EvaluateClickService implements ClickOperation {
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      const element = (await getElement(
        page,
        selectorType,
        selector
      )) as HTMLElement;

      await Promise.race([
        page.evaluate(async (sel) => {
          element?.click();
        }, selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      Logger.error(error.message, 'EvaluteClickService.operate');
      return false;
    }
  }
}
