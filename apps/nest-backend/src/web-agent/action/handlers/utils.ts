import { Page } from 'puppeteer';

export interface ActionHandler {
  handle(
    page: Page,
    projectName: string,
    eventId: string,
    step: any,
    isLastStep: boolean
  ): Promise<void>;
}

export const ACTION_HANDLERS = 'ACTION_HANDLERS';

export function getFirstSelector(selectorGroup: string | string[]): string {
  return Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
}
