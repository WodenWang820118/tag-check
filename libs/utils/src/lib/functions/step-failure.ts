/** A wait in seconds as a person reads it: `15 s`, `2.5 s`. */
function seconds(ms: number): string {
  return `${Number((ms / 1000).toFixed(1))} s`;
}

/**
 * The message of a run whose step could not find its element, such as
 * `Step 4 (click) could not find its element: none of its 3 selectors
 * appeared within 15 s.` Steps count from 1.
 */
export function describeStepFailure(failure: {
  /** 0-based. */
  stepIndex: number;
  stepType: string | null;
  selectorCount: number;
  timeoutMs: number;
}): string {
  const step = failure.stepType
    ? `Step ${failure.stepIndex + 1} (${failure.stepType})`
    : `Step ${failure.stepIndex + 1}`;
  const selectors =
    failure.selectorCount === 1
      ? 'its selector did not appear'
      : `none of its ${failure.selectorCount} selectors appeared`;
  return `${step} could not find its element: ${selectors} within ${seconds(failure.timeoutMs)}.`;
}
