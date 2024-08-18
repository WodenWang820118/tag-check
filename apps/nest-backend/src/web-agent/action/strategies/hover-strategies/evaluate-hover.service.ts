import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { getElement } from '../../action-utils';

@Injectable()
export class EvaluateHoverService {
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
          element?.focus();
        }, selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      Logger.error(
        error,
        `${EvaluateHoverService.name}.${EvaluateHoverService.prototype.operate.name}`
      );
      return false;
    }
  }
}
