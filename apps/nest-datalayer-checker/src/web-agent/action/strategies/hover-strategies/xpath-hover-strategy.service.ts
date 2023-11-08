import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType } from '../../action-utils';
import { isElementHandle } from '../click-strategies/utils';
import { HoverStrategy } from './utils';

@Injectable()
export class XPathHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    const xpath = selector.replace(SelectorType.XPATH + '/', '');
    await Promise.race([
      page.waitForXPath(xpath, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);
    const [element] = await page.$x(xpath);
    if (isElementHandle(element)) {
      await element.hover();
      return true;
    }
    return false;
  }
}
