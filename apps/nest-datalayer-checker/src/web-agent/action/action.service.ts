import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as path from 'path';
import { Page } from 'puppeteer';
import * as puppeteer from 'puppeteer';
import { UtilitiesService } from '../utilities/utilities.service';

enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
}

@Injectable()
export class ActionService {
  constructor(private utilitiesService: UtilitiesService) {}

  /**
   * Returns the operation JSON object for a given operation name
   * @param name The name of the operation
   * @returns The operation JSON object
   */
  getOperationJson(name: string, folderPath?: string) {
    const rootDir = process.cwd();
    const pathToUse = folderPath
      ? `src\\recordings\\${folderPath}`
      : '\\src\\recordings';
    const fullPath = path.join(rootDir, pathToUse, `${name}.json`);
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  }

  async performOperation(page: Page, operation: any) {
    if (!operation || !operation.steps) return;

    for (const step of operation.steps) {
      switch (step.type) {
        case BrowserAction.SETVIEWPORT:
          await this.handleSetViewport(page, step);
          break;

        case BrowserAction.NAVIGATE:
          await this.handleNavigate(page, step);
          break;

        case BrowserAction.CLICK:
          await this.handleClick(page, step);
          break;

        // Add more cases for other browser actions if needed
        default:
          console.warn(`Unknown action type: ${step.type}`);
      }
    }

    console.log('performOperation completes');
  }

  async handleSetViewport(page: Page, step: any) {
    await page.setViewport({
      width: step.width,
      height: step.height,
    });
  }

  async handleNavigate(page: Page, step: any) {
    await page.goto(step.url);
  }

  async handleClick(page: Page, step: any) {
    console.log('click');
    console.log('step.selectors: ', step.selectors);
    for (const selectorGroup of step.selectors) {
      try {
        await this.utilitiesService.scrollIntoViewIfNeeded(
          selectorGroup,
          page,
          30000,
        );
      } catch (error) {
        console.error('scrollIntoViewIfNeeded error: ', error);
      } finally {
        if (await this.clickElement(page, selectorGroup[0])) {
          return; // Return as soon as one selector works
        }
      }
    }

    throw new Error(
      `Failed to click. None of the selectors worked for action ${step.target}`,
    );
  }

  async clickElement(page: Page, selector: string, timeout: number = 30000) {
    console.log('clickElement: ', selector);
    try {
      if (
        !selector.startsWith('xpath/') &&
        !selector.startsWith('pierce/') &&
        !selector.startsWith('text/')
      ) {
        console.log('first try normal selector: ', selector);
        return await this.tryClickCSSSelector(page, selector, timeout);
      } else if (selector.startsWith('xpath/')) {
        // Handle XPath
        console.log('try xpath selector');
        return await this.tryClickXPathSelector(page, selector, timeout);
      } else if (selector.startsWith('pierce')) {
        console.log('try pierce selector');
        return await this.tryClickPierceSelector(page, selector);
      } else if (selector.startsWith('text')) {
        // Handle Text selector
        console.log('try xpath with searching text');
        return await this.tryClickTextSelector(page, selector, timeout);
      }
      return false; // Return false if the selector didn't work
    } catch (error) {
      console.error(
        `Failed to click with selector ${selector}. Reason: ${error.message}`,
      );
      return false;
    }
  }

  async tryClickCSSSelector(
    page: Page,
    selector: string,
    timeout: number,
  ): Promise<boolean> {
    await page.waitForSelector(selector, { timeout });
    await page.focus(selector);
    await new Promise(r => setTimeout(r, 1000)); // for future recording purpose
    await page.$eval(selector, el => (el as HTMLButtonElement).click());
    return true;
  }

  async tryClickXPathSelector(
    page: Page,
    selector: string,
    timeout: number,
  ): Promise<boolean> {
    const xpath = selector.replace('xpath/', '');
    await page.waitForXPath(xpath, { timeout });
    const [element] = await page.$x(xpath);
    if (element) {
      await element.focus();
      await (element as puppeteer.ElementHandle<Element>).click({
        delay: 1000,
      });
      return true;
    }
    return false;
  }

  async tryClickPierceSelector(page: Page, selector: string): Promise<boolean> {
    const elementHandle = await this.queryShadowDom(
      page,
      ...selector.replace('pierce/', '').split('/'),
    );
    if (elementHandle instanceof puppeteer.ElementHandle) {
      await elementHandle.click({ delay: 1000 });
      return true;
    }
    return false;
  }

  async tryClickTextSelector(
    page: Page,
    selector: string,
    timeout: number,
  ): Promise<boolean> {
    const xpath = `//*[text()="${selector.replace('text/', '')}"]`;
    await page.waitForXPath(xpath, { timeout });
    const [element] = await page.$x(xpath);
    if (element) {
      await (element as puppeteer.ElementHandle<Element>).click({
        delay: 1000,
      });
      return true;
    }
    return false;
  }

  async queryShadowDom(page: Page, ...selectors: any[]) {
    const jsHandle = await page.evaluateHandle((...selectors) => {
      let element: any = document;

      for (let selector of selectors) {
        if (element.shadowRoot) {
          element = element.shadowRoot.querySelector(selector);
        } else {
          element = element.querySelector(selector);
        }

        if (!element) return null;
      }

      return element;
    }, ...selectors);

    return jsHandle;
  }
}
