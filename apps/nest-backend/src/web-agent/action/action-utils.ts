import { Logger } from '@nestjs/common';
import { ElementHandle, Page } from 'puppeteer';

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

export enum SelectorSymbol {
  CSSID = '#',
  CSSCLASS = '.',
  XPATH = 'xpath',
  PIERCE = 'pierce',
  TEXT = 'text',
  ARIA = 'aria',
}

export enum SelectorType {
  CLASS = 'css',
  ID = 'id',
  XPATH = 'xpath',
  PIERCE = 'pierce',
  TEXT = 'text',
  ARIA = 'aria',
}

export function getSelectorType(selector: string) {
  try {
    if (selector.startsWith(SelectorSymbol.CSSID)) {
      return SelectorType.ID;
    } else if (selector.startsWith(SelectorSymbol.CSSCLASS)) {
      return SelectorType.CLASS;
    } else if (selector.startsWith(SelectorSymbol.XPATH)) {
      return SelectorType.XPATH;
    } else if (selector.startsWith(SelectorSymbol.PIERCE)) {
      return SelectorType.PIERCE;
    } else if (selector.startsWith(SelectorSymbol.TEXT)) {
      return SelectorType.TEXT;
    } else if (selector.startsWith(SelectorSymbol.ARIA)) {
      return SelectorType.ARIA;
    } else {
      return SelectorType.CLASS;
    }
  } catch (error) {
    Logger.error(error.message, 'SelectorSymbol');
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getElement(
  page: Page,
  selectorType: string,
  selector: string
) {
  switch (selectorType) {
    case 'css':
      return document.querySelector(selector);
    case 'id':
      return document.querySelector(selector);
    case 'aria': {
      const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
      const ariaAttribute = match[1];
      const ariaValue = match[2];
      const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;
      return document.querySelector(constructedSelector);
    }
    case 'text': {
      const textSelector = selector.replace('text/', '');
      const element = getElementByText(textSelector);
      if (isElementHandle(element)) {
        return element;
      }
      break;
    }
    case 'xpath': {
      const xpathSelector = selector.replace('xpath/', '');
      const element = await findElementByXPath(page, xpathSelector);
      if (isElementHandle(element)) {
        return element;
      }
      break;
    }
    case 'pierce': {
      // TODO: will need user to manually specify the shadow host selector and shadow dom selector
      // specifically replacing the 'pierce/' part of the selector with the shadow host selector
      const shadowHostSelector = selector.split('/')[0];
      const shadowDomSelector = selector.split('/')[1];
      return queryShadowDom(shadowHostSelector, shadowDomSelector);
    }
    default:
      Logger.error(
        `Unknown selector type: ${selectorType}`,
        'evaluate.selectorFunctions'
      );
      return null;
  }
}

export function isElementHandle(obj: any): obj is ElementHandle<Element> {
  return (
    obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
  );
}

function getElementByText(searchText) {
  const allElements = document.querySelectorAll('*');
  for (const element of Array.from(allElements)) {
    if (element.textContent.trim() === searchText) {
      return element;
    }
  }
  return null; // Return null if no element with the specified text is found
}

async function findElementByXPath(page: Page, xpath: string) {
  // TODO: deprecated page.$x; please handle it
  const elements = await page.$$(xpath);
  if (elements.length > 0) {
    return elements[0]; // Assuming you want the first element found
  } else {
    return null; // No element found
  }
}

export function queryShadowDom(selector: string, shadowHostSelector: string) {
  const shadowHost = document.querySelector(shadowHostSelector);
  if (!shadowHost) return null;

  const shadowRoot = shadowHost.shadowRoot;
  if (!shadowRoot) return null;

  return shadowRoot.querySelector(selector);
}
