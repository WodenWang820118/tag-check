import type { QueryRoot } from '../../handlers/frame';

/**
 * One way of clicking an element. Resolves true when the click was sent,
 * false when it failed or timed out; it does not throw. `page` is the step's
 * frame when the click was recorded inside one.
 */
export interface ClickOperation {
  operate: (
    page: QueryRoot,
    projectName: string,
    title: string,
    selector: string,
    selectorType: string,
    timeout?: number
  ) => Promise<boolean>;
}
