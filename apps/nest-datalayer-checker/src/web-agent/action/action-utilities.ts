import { Logger } from '@nestjs/common';
import { Page } from 'puppeteer';

export enum BrowserAction {
  CLICK = 'click',
  NAVIGATE = 'navigate',
  SETVIEWPORT = 'setViewport',
  CHANGE = 'change',
  HOVER = 'hover',
  KEYDOWN = 'keyDown',
  KEYUP = 'keyUp',
  WAITFORELEMENT = 'waitForElement',
}

export enum SelectorType {
  CSS = '#',
  XPATH = 'xpath',
  PIERCE = 'pierce',
  TEXT = 'text',
  ARIA = 'aria',
}

export function getSelectorType(selector: string) {
  try {
    if (selector.startsWith(SelectorType.CSS)) {
      return SelectorType.CSS;
    } else if (selector.startsWith(SelectorType.XPATH)) {
      return SelectorType.XPATH;
    } else if (selector.startsWith(SelectorType.PIERCE)) {
      return SelectorType.PIERCE;
    } else if (selector.startsWith(SelectorType.TEXT)) {
      return SelectorType.TEXT;
    } else if (selector.startsWith(SelectorType.ARIA)) {
      return SelectorType.ARIA;
    }
    return SelectorType.CSS;
  } catch (error) {
    Logger.error(error.message, 'getSelectorType');
  }
}

export async function queryShadowDom(page: Page, ...selectors: any[]) {
  const jsHandle = await page.evaluateHandle((...selectors) => {
    let element: any = document;

    for (const selector of selectors) {
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

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
