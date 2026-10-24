import { Page } from 'puppeteer';

/**
 * One way of clicking an element. Resolves true when the click was sent,
 * false when it failed or timed out; it does not throw.
 */
export interface ClickOperation {
  operate: (
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    selectorType: string,
    timeout?: number
  ) => Promise<boolean>;
}
