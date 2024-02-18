import { ElementHandle, Page } from 'puppeteer';

export interface HoverStrategy {
  hoverElement(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<boolean>;
}

export function isElementHandle(obj: any): obj is ElementHandle<Element> {
  return (
    obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
  );
}
