import { Page } from 'puppeteer';

export interface HoverStrategy {
  hoverElement(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<boolean>;
}
