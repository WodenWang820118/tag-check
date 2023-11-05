import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { queryShadowDom, SelectorType } from '../../action-utilities';
import { ClickStrategy } from './utils';
import { isElementHandle } from './utils';

@Injectable()
export class PierceClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000,
    preventNavigation = false
  ): Promise<boolean> {
    Logger.log(`${selector}`, 'PierceClickStrategy.clickElement');

    // Add navigation prevention if required
    if (preventNavigation) {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.addEventListener('click', (e) => {
            e.preventDefault(); // This will prevent the click from causing navigation
            console.log('Navigation prevented on click!');
          });
        }
      }, selector);
    }

    try {
      const elementHandle = await queryShadowDom(
        page,
        ...selector.replace(SelectorType.PIERCE + '/', '').split('/'),
        { timeout }
      );
      if (isElementHandle(elementHandle)) {
        await elementHandle.click({ delay: 1000 });
        return true;
      }
    } catch (error) {
      Logger.error(`${error.message}`, 'PierceClickStrategy.clickElement');
      return false;
    }
  }
}
