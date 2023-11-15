import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { ClickStrategy } from './utils';
// TODO: timeout should be configurable
@Injectable()
export class AriaClickStrategy implements ClickStrategy {
  async clickElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout?: number,
    preventNavigation?: boolean
  ): Promise<boolean> {
    Logger.log(selector, 'AriaClickStrategy.clickElement');

    // Extract the ARIA attribute and value using regex
    const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
    if (!match) {
      Logger.error(
        'Does not find a aria attribute',
        'AriaClickStrategy.clickElement'
      );
      return false;
    }
    const ariaAttribute = match[1];
    const ariaValue = match[2];
    const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;

    // it could be a navigation before awaiting the selector
    await Promise.race([
      page.waitForSelector(selector, { timeout, visible: true }),
      page.waitForNavigation({ timeout }),
    ]);

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
      await page.focus(constructedSelector);
      await page.click(constructedSelector, { delay: 1000 });
      Logger.log('Clicked using page.click', 'AriaClickStrategy.clickElement');
    } catch (error) {
      Logger.error(error.message, 'AriaClickStrategy.clickElement');
      Logger.log(
        `page.evaluate click: ${constructedSelector}`,
        'AriaClickStrategy.clickElement'
      );

      try {
        await Promise.race([
          page.evaluate((sel) => {
            const element = document.querySelector(sel) as HTMLElement;
            if (!element) {
              throw new Error(`No element found for selector: ${sel}`);
            }
            element.click();
          }, constructedSelector),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);
      } catch (evaluateError) {
        Logger.error(evaluateError.message, 'AriaClickStrategy.clickElement');
        return false;
      }
    }
    return true;
  }
}
