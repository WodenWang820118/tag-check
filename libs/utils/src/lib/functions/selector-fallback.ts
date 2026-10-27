import type {
  ElementCandidate,
  StepFailureContext,
  StepFallback
} from '../types/tag-check/step-failure.type';
import { recordedHints } from './selector-suggestion';

/**
 * A candidate that clearly is the element a step's recorded selectors
 * described. `matchedBy` is the hint that singled it out, and `value` is
 * that hint as it was recorded.
 */
export type FallbackChoice = {
  /** The element to retry the step with. */
  candidate: ElementCandidate;
  /** Which recorded hint singled it out. */
  matchedBy: StepFallback['matchedBy'];
  /** The recorded test hook, id or name it matched. */
  value: string;
};

/** Trimmed, with internal whitespace collapsed, in lower case. */
function normaliseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

type Rule = {
  matchedBy: StepFallback['matchedBy'];
  valueOf: (candidate: ElementCandidate) => string | null;
};

/**
 * The one candidate a failed step may be retried with, or null when that
 * would be a guess. No model is involved.
 *
 * Hints come from the step's recorded selectors. The first of these rules
 * that matches any candidate decides, and it must match exactly one: the
 * candidate's `data-testid` equals a recorded test hook, or its `id`
 * equals a recorded id, or its accessible name equals a recorded aria or
 * text name (trimmed, with whitespace collapsed, in lower case). Two
 * matches is ambiguous. A candidate whose tag is not the tag the selectors
 * name is not the recorded element. A candidate with no selector is
 * ignored, because the retry has to wait for something.
 */
export function chooseFallbackCandidate(
  context: Pick<StepFailureContext, 'selectors' | 'candidates'>
): FallbackChoice | null {
  const hints = recordedHints(context.selectors.map((entry) => entry.selector));
  const candidates = context.candidates.filter(
    (candidate) => candidate.selectors.length > 0
  );
  const rules: Rule[] = [
    {
      matchedBy: 'testId',
      valueOf: (candidate) => {
        const testId = candidate.attributes['data-testid'];
        return testId !== undefined && hints.testIds.includes(testId)
          ? testId
          : null;
      }
    },
    {
      matchedBy: 'id',
      valueOf: (candidate) => {
        const id = candidate.attributes['id'];
        return id !== undefined && hints.ids.includes(id) ? id : null;
      }
    },
    {
      matchedBy: 'name',
      valueOf: (candidate) => {
        const name = normaliseName(candidate.name);
        if (name === '') return null;
        return (
          hints.names.find((recorded) => normaliseName(recorded) === name) ??
          null
        );
      }
    }
  ];

  for (const rule of rules) {
    const matches: { candidate: ElementCandidate; value: string }[] = [];
    for (const candidate of candidates) {
      const value = rule.valueOf(candidate);
      if (value !== null) matches.push({ candidate, value });
    }
    if (matches.length === 0) continue;
    if (matches.length > 1) return null;
    const chosen = matches[0];
    if (!chosen) return null;
    if (hints.tag && hints.tag !== chosen.candidate.tag) return null;
    return {
      candidate: chosen.candidate,
      matchedBy: rule.matchedBy,
      value: chosen.value
    };
  }
  return null;
}
