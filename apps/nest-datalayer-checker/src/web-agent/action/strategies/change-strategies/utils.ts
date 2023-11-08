import { Page } from 'puppeteer';

export interface ChangeStrategy {
  changeElement(
    page: Page,
    selector: string,
    value: string,
    timeout?: number
  ): Promise<boolean>;
}
