import type { StepFallback } from '../types/tag-check/step-failure.type';

/** How `matchedBy` reads in a result message. */
const MATCH_WORD: Record<StepFallback['matchedBy'], string> = {
  testId: 'test hook',
  id: 'id',
  name: 'name'
};

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

/**
 * One sentence for a step that continued with a fallback selector, such as
 * `Step 5 (click) used a fallback selector [data-testid="add-to-cart"]:
 * its recorded selectors found nothing, and one element matched the
 * recorded test hook "add-to-cart".` Steps count from 1. `matchedBy`
 * reads as "test hook", "id" or "name".
 */
export function describeStepFallback(
  fallback: Omit<StepFallback, 'selectors'>
): string {
  const step = `Step ${fallback.stepIndex + 1} (${fallback.stepType})`;
  return (
    `${step} used a fallback selector ${fallback.selector}: its recorded ` +
    `selectors found nothing, and ${describeFallbackMatch(fallback)}.`
  );
}

/**
 * Why a fallback was chosen, such as `one element matched the recorded
 * test hook "add-to-cart"`.
 */
export function describeFallbackMatch(
  fallback: Pick<StepFallback, 'matchedBy' | 'value'>
): string {
  return `one element matched the recorded ${MATCH_WORD[fallback.matchedBy]} "${fallback.value}"`;
}
