/**
 * One event Chrome Recorder attaches to a step. `navigation` means the
 * step's action loads a new document. `url` and `title` are the patterns the
 * recorder stored for that document, when it stored any.
 */
export type AssertedEvent = {
  type: string;
  url?: string;
  title?: string;
};

export type Step = {
  /** Discriminator identifying the action type (e.g. 'click', 'navigate', 'setViewport'). */
  type: string;
  /** CSS selector string for the target element. */
  target?: string;
  /**
   * Alternative selectors for the step's element, in the Chrome DevTools
   * Recorder format: each is a selector string or an array. An array of two or more
   * parts is a shadow-DOM chain: each part is queried inside the shadow root
   * of the element the previous part matched.
   */
  selectors?: (string | string[])[];
  /**
   * Child-frame indices from the main frame, as Chrome Recorder writes them.
   * Omitted or empty means the main frame. `[0, 1]` is
   * `mainFrame.childFrames()[0].childFrames()[1]`.
   */
  frame?: number[];
  /**
   * Events the recorder asserts this step causes. An entry with
   * `type: 'navigation'` means the action loads a new document, so the replay
   * waits for that navigation before the next step.
   */
  assertedEvents?: AssertedEvent[];
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
