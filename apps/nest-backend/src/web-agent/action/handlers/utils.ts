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

export interface Step {
  type: string;
  target: string;
  selectors: string[];
  url?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface OperationFile {
  steps: Step[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const ACTION_HANDLERS = 'ACTION_HANDLERS';

export function getFirstSelector(selectorGroup: string | string[]): string {
  return Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
}
