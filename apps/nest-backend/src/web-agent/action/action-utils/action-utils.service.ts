/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { SelectorSymbol, SelectorType } from '../action-utils';
import { Page, ElementHandle } from 'puppeteer';

@Injectable()
export class ActionUtilsService {
  getSelectorType(selector: string) {
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
      Logger.error(error, 'SelectorSymbol');
    }
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getElement(page: Page, selectorType: string, selector: string) {
    switch (selectorType) {
      case 'css':
        return document.querySelector(selector);
      case 'id':
        return document.querySelector(selector);
      case 'aria': {
        const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
        if (!match) {
          Logger.error(
            `Invalid ARIA selector: ${selector}`,
            'evaluate.selectorFunctions'
          );
          return null;
        }

        const ariaAttribute = match[1];
        const ariaValue = match[2];
        const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;
        return document.querySelector(constructedSelector);
      }
      case 'text': {
        const textSelector = selector.replace('text/', '');
        const element = this.getElementByText(textSelector);
        if (this.isElementHandle(element)) {
          return element;
        }
        break;
      }
      case 'xpath': {
        const xpathSelector = selector.replace('xpath/', '');
        const element = this.findElementByXPath(page, xpathSelector);
        if (this.isElementHandle(element)) {
          return element;
        }
        break;
      }
      case 'pierce': {
        // TODO: will need user to manually specify the shadow host selector and shadow dom selector
        // specifically replacing the 'pierce/' part of the selector with the shadow host selector
        const shadowHostSelector = selector.split('/')[0];
        const shadowDomSelector = selector.split('/')[1];
        return this.queryShadowDom(shadowHostSelector, shadowDomSelector);
      }
      default:
        Logger.error(
          `Unknown selector type: ${selectorType}`,
          'evaluate.selectorFunctions'
        );
        return null;
    }
  }

  isElementHandle(obj: any): obj is ElementHandle<Element> {
    return (
      obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
    );
  }

  getElementByText(searchText: string) {
    const allElements = document.querySelectorAll('*');

    for (const element of Array.from(allElements)) {
      if (
        element.nodeType === Node.TEXT_NODE &&
        element.textContent &&
        element.textContent.trim() === searchText
      ) {
        return element;
      }
    }
    return null; // Return null if no element with the specified text is found
  }

  async findElementByXPath(page: Page, xpath: string) {
    // TODO: deprecated page.$x; please handle it
    const elements = await page.$$(xpath);
    if (elements.length > 0) {
      return elements[0]; // Assuming you want the first element found
    } else {
      return null; // No element found
    }
  }

  queryShadowDom(selector: string, shadowHostSelector: string) {
    const shadowHost = document.querySelector(shadowHostSelector);
    if (!shadowHost) return null;

    const shadowRoot = shadowHost.shadowRoot;
    if (!shadowRoot) return null;

    return shadowRoot.querySelector(selector);
  }
}
