import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType } from '../../action-utils';
import { ChangeStrategy } from './utils';

@Injectable()
export class PierceChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean> {
    await Promise.race([
      page.waitForSelector(selector.replace(SelectorType.PIERCE + '/', ''), {
        timeout,
        visible: true,
      }),
      page.waitForNavigation({ timeout }),
    ]);
    await page.type(selector.replace(SelectorType.PIERCE + '/', ''), value);
    return true;
  }
}
