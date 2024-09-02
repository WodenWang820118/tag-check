import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { getElement } from '../../action-utils';
import { ChangeOperation } from './utils';

@Injectable()
export class EvaluateChangeService implements ChangeOperation {
  async operate(
    page: Page,
    projectName: string,
    eventId: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout = 5000
  ): Promise<boolean> {
    // TODO: verifiy this
    if (!value) {
      Logger.error(
        'Value is required to change the element',
        `${EvaluateChangeService.name}.${EvaluateChangeService.prototype.operate.name}`
      );
      return false;
    }

    try {
      const element = (await getElement(
        page,
        selectorType,
        selector
      )) as HTMLElement;
      const isSelect = element.tagName.toLowerCase() === 'select';

      await Promise.race([
        page.evaluate(async (sel) => {
          if (isSelect) {
            const element = document.querySelector(sel) as HTMLSelectElement;
            element.value = value;
          } else {
            const element = document.querySelector(sel) as HTMLInputElement;
            element.value = value;
          }
        }, selector),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        ),
      ]);
      return true;
    } catch (error) {
      Logger.error(
        error,
        `${EvaluateChangeService.name}.${EvaluateChangeService.prototype.operate.name}`
      );
      return false;
    }
  }
}
