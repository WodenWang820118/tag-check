import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { SelectorType } from '../../action-utils';
import { ClickStrategy } from './utils';
import { isElementHandle } from './utils';

@Injectable()
export class TextClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout = 1000,
    preventNavigation = false
  ): Promise<boolean> {
    Logger.log(`${selector}`, 'TextClickStrategy.clickElement');

    const xpath = `//*[text()="${selector.replace(
      SelectorType.TEXT + '/',
      ''
    )}"]`;
    // Add navigation prevention if required
    // it could be a navigation before awaiting the selector
    await Promise.race([
      page.waitForXPath(xpath, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);

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
      const [element] = await page.$x(xpath);
      if (isElementHandle(element)) {
        await element.click({ delay: 1000 });
        return true;
      }
    } catch (error) {
      Logger.log(`${error.message}`, 'TextClickStrategy.clickElement');
      return false;
    }
  }
}
