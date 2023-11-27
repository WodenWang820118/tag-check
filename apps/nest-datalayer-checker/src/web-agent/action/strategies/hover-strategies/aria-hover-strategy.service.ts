import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { HoverStrategy } from './utils';

@Injectable()
export class AriaHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    // Extract the ARIA attribute and value using regex
    const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
    if (!match) {
      Logger.log('Does not find a aria attribute');
      return false;
    }

    const ariaAttribute = match[1];
    const ariaValue = match[2];
    const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;

    try {
      await Promise.race([
        page.waitForSelector(constructedSelector, { timeout, visible: true }),
        page.waitForNavigation({ timeout }),
      ]);
      const element = await page.$(constructedSelector);
      if (element) {
        await element.hover();
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `Failed to hover over element with selector: ${constructedSelector}. Error: ${error}`
      );
      return false;
    }
  }
}
