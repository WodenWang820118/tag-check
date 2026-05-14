export type Step = {
  /** Discriminator identifying the action type (e.g. 'click', 'navigate', 'setViewport'). */
  type: string;
  /** CSS selector string for the target element. */
  target?: string;
  /**
   * Ordered list of selectors or selector groups to try.
   * Each element can be a plain CSS selector string or an array of fallback selectors
   * (following the Chrome DevTools Recorder format).
   */
  selectors?: (string | string[])[];
  /** Navigation URL used by navigate steps. */
  url?: string;
  /** Horizontal click offset relative to the element bounding box. */
  offsetX?: number;
  /** Vertical click offset relative to the element bounding box. */
  offsetY?: number;
  /** Optional timeout in milliseconds used by wait-for-element steps. */
  timeout?: number;
  /** Key identifier used by keydown/keyup steps. */
  key?: string;
  /** Whether the element must be visible when waiting for it. */
  visible?: boolean;
  /** New value to assign when performing a change/input step. */
  value?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type OperationFile = {
  steps: Step[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
