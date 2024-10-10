import { Page } from 'puppeteer';

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
