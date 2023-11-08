import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { queryShadowDom, SelectorType } from '../../action-utils';
import { isElementHandle } from '../click-strategies/utils';
import { HoverStrategy } from './utils';

@Injectable()
export class PierceHoverStrategy implements HoverStrategy {
  async hoverElement(
    page: Page,
    selector: string,
    timeout = 1000
  ): Promise<boolean> {
    const elementHandle = await queryShadowDom(
      page,
      ...selector.replace(SelectorType.PIERCE + '/', '').split('/'),
      { timeout }
    );
    if (isElementHandle(elementHandle)) {
      await elementHandle.hover();
      return true;
    }
    return false;
  }
}
