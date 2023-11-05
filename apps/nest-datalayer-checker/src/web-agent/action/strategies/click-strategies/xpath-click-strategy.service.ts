import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType } from '../../action-utils';
import { ClickStrategy } from './utils';
import { isElementHandle } from './utils';

@Injectable()
export class XPathClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    selector: string,
    timeout = 1000,
    preventNavigation = false
  ): Promise<boolean> {
    Logger.log(`${selector}`, 'XPathClickStrategy.clickElement');
    const xpath = selector.replace(SelectorType.XPATH + '/', '');
    await Promise.race([
      page.waitForXPath(xpath, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);

    // Add navigation prevention if required
    if (preventNavigation) {
      await page.evaluate(
        (sel) => {
          const element = document.querySelector(sel);
          if (element) {
            element.addEventListener('click', (e) => {
              e.preventDefault(); // This will prevent the click from causing navigation
              console.log('Navigation prevented on click!');
            });
          }
        },
        selector,
        timeout
      );
    }

    try {
      const [element] = await page.$x(xpath);
      if (isElementHandle(element)) {
        await element.focus();
        await element.click({ delay: 1000 });
        return true;
      }
    } catch (error) {
      Logger.error(`${error.message}`, 'XPathClickStrategy.clickElement');
      return false;
    }
  }
}
