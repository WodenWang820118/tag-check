import { Page } from 'puppeteer';

export interface ClickStrategy {
  clickElement(
    page: Page,
    projectName: string,
    title: string,
    selector: string,
    selectorType: string,
    useNormalClick: boolean,
    timeout?: number
  ): Promise<boolean>;
}

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
