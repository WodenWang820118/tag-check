import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { sleep } from '../../action-utils';
import { HoverStrategy } from './utils';

@Injectable()
export class CSSHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 3000
  ): Promise<boolean> {
    await Promise.race([
      page.waitForSelector(selector, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);
    await sleep(1000); // for future recording purpose
    await page.hover(selector);
    return true;
  }
}
