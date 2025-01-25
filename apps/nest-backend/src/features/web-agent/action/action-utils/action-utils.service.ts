/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { SelectorSymbol, SelectorType } from '../action-utils';
import { Page, ElementHandle, JSHandle } from 'puppeteer';

@Injectable()
export class ActionUtilsService {
  private readonly logger = new Logger(ActionUtilsService.name);
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
      this.logger.error(error);
    }
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getElement(
    page: Page,
    selectorType: string,
    selector: string
  ): Promise<ElementHandle<Element> | null> {
    try {
      switch (selectorType) {
        case 'css':
        case 'id':
          return await page.$(selector);

        case 'aria':
          return await this.getElementByAria(page, selector);

        case 'text':
          return await this.getElementByText(
            page,
            selector.replace('text/', '')
          );

        case 'xpath':
          return await this.findElementByXPath(
            page,
            selector.replace('xpath/', '')
          );

        case 'pierce':
          return await this.getElementByShadowDom(page, selector);

        default:
          throw new Error(`Unknown selector type: ${selectorType}`);
      }
    } catch (error) {
      this.logger.error(`Error in getElement: ${error}`);
      return null;
    }
  }

  private async getElementByAria(
    page: Page,
    selector: string
  ): Promise<ElementHandle<Element> | null> {
    const match = selector.match(/aria\/(aria-\w+)\/(.+)/);
    if (!match) {
      throw new Error(`Invalid ARIA selector: ${selector}`);
    }

    const [, ariaAttribute, ariaValue] = match;
    const constructedSelector = `[${ariaAttribute}="${ariaValue}"]`;
    return await page.$(constructedSelector);
  }

  private async getElementByText(
    page: Page,
    text: string
  ): Promise<ElementHandle<Element> | null> {
    return await page.$(`text=${text}`);
  }

  private async getElementByShadowDom(
    page: Page,
    selector: string
  ): Promise<ElementHandle<Element> | null> {
    const [shadowHostSelector, shadowDomSelector] = selector.split('/');
    if (!shadowHostSelector || !shadowDomSelector) {
      throw new Error(`Invalid shadow DOM selector: ${selector}`);
    }

    const jsHandle = await page.evaluateHandle(
      (host, shadow) => {
        const shadowRoot = document.querySelector(host)?.shadowRoot;
        return shadowRoot?.querySelector(shadow) || null;
      },
      shadowHostSelector,
      shadowDomSelector
    );

    return this.convertJSHandleToElementHandle(page, jsHandle);
  }

  private async convertJSHandleToElementHandle(
    page: Page,
    jsHandle: JSHandle
  ): Promise<ElementHandle<Element> | null> {
    if (jsHandle.asElement()) {
      return jsHandle.asElement() as ElementHandle<Element>;
    }
    await jsHandle.dispose();
    return null;
  }

  isElementHandle(obj: any): obj is ElementHandle<Element> {
    return (
      obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
    );
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
