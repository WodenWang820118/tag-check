import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType } from '../../action-utils';
import { ChangeStrategy } from './utils';

@Injectable()
export class XpathChangeStrategy implements ChangeStrategy {
  async changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout = 1000
  ): Promise<boolean> {
    await Promise.race([
      page.waitForXPath(selector.replace(SelectorType.XPATH + '/', ''), {
        timeout,
        visible: true,
      }),
      page.waitForNavigation({ timeout }),
    ]);

    const [input] = await page.$x(selector.replace('xpath/', ''));
    await input.type(value);
    return true;
  }
}
