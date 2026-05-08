import { Injectable, Logger } from '@nestjs/common';
import { SelectorSymbol, SelectorType } from '../action-utils';
import { Page, ElementHandle, JSHandle } from 'puppeteer';

@Injectable()
export class ActionUtilsService {
  private readonly logger = new Logger(ActionUtilsService.name);
  getSelectorType(selector: string) {
    try {
      if (this.isXPathSelector(selector)) {
        return SelectorType.XPATH;
      } else if (selector.startsWith(SelectorSymbol.CSSID)) {
        return SelectorType.ID;
      } else if (selector.startsWith(SelectorSymbol.CSSCLASS)) {
        return SelectorType.CLASS;
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
          return await page.$(this.withQueryPrefix(selector, 'text'));

        case 'xpath':
          return await page.$(this.withQueryPrefix(selector, 'xpath'));

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
    const legacyAttributeSelector = /^aria\/(aria-\w+)\/(.+)$/.exec(selector);
    if (legacyAttributeSelector) {
      const [, ariaAttribute, ariaValue] = legacyAttributeSelector;
      return await page.$(`[${ariaAttribute}="${ariaValue}"]`);
    }

    return await page.$(this.withQueryPrefix(selector, 'aria'));
  }

  private withQueryPrefix(selector: string, prefix: string): string {
    return selector.startsWith(`${prefix}/`)
      ? selector
      : `${prefix}/${selector}`;
  }

  private isXPathSelector(selector: string): boolean {
    return (
      selector.startsWith(SelectorSymbol.XPATH) ||
      selector.startsWith('/') ||
      selector.startsWith('./')
    );
  }

  private async getElementByShadowDom(
    page: Page,
    selector: string
  ): Promise<ElementHandle<Element> | null> {
    const body = selector.startsWith('pierce/')
      ? selector.slice('pierce/'.length)
      : selector;
    const separatorIndex = body.indexOf('/');

    if (separatorIndex === -1) {
      return await page.$(this.withQueryPrefix(selector, 'pierce'));
    }

    const shadowHostSelector = body.slice(0, separatorIndex);
    const shadowDomSelector = body.slice(separatorIndex + 1);
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

    return this.convertJSHandleToElementHandle(jsHandle);
  }

  private async convertJSHandleToElementHandle(
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

  queryShadowDom(selector: string, shadowHostSelector: string) {
    const shadowHost = document.querySelector(shadowHostSelector);
    if (!shadowHost) return null;

    const shadowRoot = shadowHost.shadowRoot;
    if (!shadowRoot) return null;

    return shadowRoot.querySelector(selector);
  }
}
