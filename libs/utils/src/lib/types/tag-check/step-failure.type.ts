/**
 * A page element a failed step may have meant, as the run saw it when the
 * step gave up: visible, and one a person can act on (links, buttons,
 * fields, elements with a role or a test hook).
 */
export type ElementCandidate = {
  /** Its position in StepFailureContext.candidates. */
  index: number;
  /** Lower case, such as `button`. */
  tag: string;
  /** Its ARIA role, given or implied by its tag; null without one. */
  role: string | null;
  /**
   * Its name as a person reads it: aria-label, aria-labelledby, a label,
   * alt, title, placeholder or its text; up to 100 characters.
   */
  name: string;
  /**
   * The attributes that identify it, when set: id, name, type, href,
   * data-testid, aria-label, placeholder, title.
   */
  attributes: Record<string, string>;
  /** Where it was in the viewport, in CSS pixels, rounded. */
  box: { x: number; y: number; width: number; height: number };
  /**
   * CSS selectors that each matched only this element when the step gave
   * up, most stable first.
   */
  selectors: string[];
};

/**
 * What a run saw when a step could not find its element: the step's own
 * selectors and what they matched, the page, and the elements it could
 * have meant. Facts only: suggestions are made from them later.
 */
export type StepFailureContext = {
  /** 0-based. */
  stepIndex: number;
  /** The step's type, such as `click`. */
  stepType: string;
  /**
   * The step's selectors as recorded, each with how many elements it
   * matched when the step gave up; null when that could not be counted.
   */
  selectors: { selector: string; matches: number | null }[];
  /** How long the step waited for them, in milliseconds. */
  timeoutMs: number;
  /** Where the recorded click landed in its element, when recorded. */
  offset: { x: number; y: number } | null;
  url: string;
  title: string;
  viewport: { width: number; height: number };
  candidates: ElementCandidate[];
  /** How many candidates the page had; only the first ones are kept. */
  candidatesFound: number;
  /** ISO 8601. */
  capturedAt: string;
};

/**
 * Which step of a run could not find its element: what a test's page shows
 * before it reads the whole StepFailureContext.
 */
export type StepFailureSummary = Pick<
  StepFailureContext,
  'stepIndex' | 'stepType' | 'url'
>;

/**
 * A step the run retried with a fallback selector: its recorded selectors
 * found nothing, and one candidate clearly was the element. The result's
 * message says so. No model is involved.
 */
export type StepFallback = {
  /** 0-based. */
  stepIndex: number;
  /** The step's type, such as `click`. */
  stepType: string;
  /**
   * The selector the result names. The retry tries every selector of the
   * candidate; this is its first, which is the most stable.
   */
  selector: string;
  /** Which recorded hint singled the candidate out. */
  matchedBy: 'testId' | 'id' | 'name';
  /** The recorded test hook, id or name it matched. */
  value: string;
};
