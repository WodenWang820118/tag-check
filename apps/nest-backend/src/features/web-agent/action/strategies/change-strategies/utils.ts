import { Page } from 'puppeteer';

/** Changes an element by trying each change method in turn. */
export interface ChangeStrategy {
  changeElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout?: number
  ): Promise<boolean>;
}

/**
 * One way of changing an element. Resolves true when the value was typed or
 * selected, false when it failed or timed out; it does not throw.
 */
export interface ChangeOperation {
  operate: (
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    selectorType: string,
    value?: string,
    timeout?: number
  ) => Promise<boolean>;
}
