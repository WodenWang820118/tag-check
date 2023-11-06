import { ElementHandle, Page } from 'puppeteer';

export interface ClickStrategy {
  clickElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    timeout?: number,
    preventNavigation?: boolean
  ): Promise<boolean>;
}

export function isElementHandle(obj: any): obj is ElementHandle<Element> {
  return (
    obj && typeof obj.click === 'function' && typeof obj.focus === 'function'
  );
}
