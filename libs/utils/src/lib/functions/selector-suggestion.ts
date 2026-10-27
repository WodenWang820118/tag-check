import type {
  ElementCandidate,
  StepFailureContext
} from '../types/tag-check/step-failure.type';

/** What a step's recorded selectors say about the element it meant. */
export type RecordedHints = {
  /** Accessible names and texts: from `aria/` and `text/` selectors. */
  names: string[];
  /** `data-testid` values. */
  testIds: string[];
  /** `#id` values. */
  ids: string[];
  /** The element's tag, when a selector names one. */
  tag: string | null;
};

const TEST_ID = /\[data-testid=["']?([^"'\]]+)["']?\]/g;
const ID = /#([A-Za-z][\w-]*)/g;
const LEADING_TAG = /^([a-z][a-z0-9-]*)(?=[.#[:\s>]|$)/i;
const XPATH_TAG = /\/([a-z][a-z0-9-]*)(?:\[\d+\])?$/i;

/**
 * Reads the names, test hooks, ids and tag in a step's selectors, as
 * Chrome Recorder writes them: `aria/Add to cart`, `aria/Add[role="button"]`,
 * `text/Add`, `[data-testid="add"]`, `#add`, `button.primary`,
 * `xpath//main/form/button`, `pierce/...`.
 */
export function recordedHints(selectors: readonly string[]): RecordedHints {
  const hints: RecordedHints = { names: [], testIds: [], ids: [], tag: null };
  const add = (list: string[], value: string) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) list.push(trimmed);
  };
  for (const selector of selectors) {
    if (selector.startsWith('aria/')) {
      add(hints.names, selector.slice(5).replace(/\[role=.*\]$/, ''));
      continue;
    }
    if (selector.startsWith('text/')) {
      add(hints.names, selector.slice(5));
      continue;
    }
    if (selector.startsWith('xpath/')) {
      hints.tag ??= XPATH_TAG.exec(selector)?.[1]?.toLowerCase() ?? null;
      continue;
    }
    const css = selector.replace(/^pierce\//, '');
    for (const match of css.matchAll(TEST_ID)) add(hints.testIds, match[1]);
    for (const match of css.matchAll(ID)) add(hints.ids, match[1]);
    const last = css.split(/\s*>\s*|\s+/).pop() ?? '';
    hints.tag ??= LEADING_TAG.exec(last)?.[1]?.toLowerCase() ?? null;
  }
  return hints;
}

/** Lower-case words of a name, test hook or id: `add-to-cart` → add, to, cart. */
function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9À-￿]+/)
    .filter((word) => word.length > 1);
}

/** The share of `wanted`'s words that `found` has, 0 to 1. */
function overlap(wanted: readonly string[], found: readonly string[]): number {
  const want = new Set(wanted.flatMap(words));
  if (want.size === 0) return 0;
  const have = new Set(found.flatMap(words));
  let shared = 0;
  for (const word of want) if (have.has(word)) shared++;
  return shared / want.size;
}

/** How much `candidate` looks like what the recorded selectors describe. */
export function candidateScore(
  candidate: ElementCandidate,
  hints: RecordedHints
): number {
  const testId = candidate.attributes['data-testid'] ?? '';
  const id = candidate.attributes['id'] ?? '';
  const names = [candidate.name, candidate.attributes['aria-label'] ?? ''];
  let score =
    3 * overlap(hints.names, names) +
    3 * overlap(hints.testIds, [testId]) +
    2 * overlap(hints.ids, [id]) +
    // A hook or id that says what the recorded name said.
    overlap(hints.names, [testId, id]) +
    overlap(hints.testIds, names);
  if (
    hints.names.some(
      (name) => name.toLowerCase() === candidate.name.toLowerCase()
    )
  ) {
    score += 2;
  }
  if (hints.tag && hints.tag === candidate.tag) score += 0.5;
  return score;
}

/**
 * The candidates most like what the step's selectors describe, best first,
 * at most `limit`; ties keep page order. Candidates without a selector are
 * left out: a suggestion must give the step something to wait for.
 */
export function rankCandidates(
  context: Pick<StepFailureContext, 'selectors' | 'candidates'>,
  limit: number
): ElementCandidate[] {
  const hints = recordedHints(context.selectors.map((s) => s.selector));
  return context.candidates
    .filter((candidate) => candidate.selectors.length > 0)
    .map((candidate) => ({
      candidate,
      score: candidateScore(candidate, hints)
    }))
    .sort((a, b) => b.score - a.score || a.candidate.index - b.candidate.index)
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate);
}

/** The most selectors a trial may try for one step. */
export const TRIAL_SELECTORS_MAX = 5;

/** The longest selector a trial accepts. */
export const TRIAL_SELECTOR_MAX_LENGTH = 500;

/** A trial request that passed validation, or the reason it did not. */
export type SelectorTrialValidation =
  | { ok: true; request: { stepIndex: number; selectors: string[] } }
  | { ok: false; error: string };

/**
 * Checks the body of POST /ai-assist/trials: a step index from 0, and 1 to
 * TRIAL_SELECTORS_MAX selectors, trimmed, without repeats.
 */
export function validateSelectorTrial(input: unknown): SelectorTrialValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'The body must be an object' };
  }
  const { stepIndex, selectors } = input as Record<string, unknown>;
  if (
    typeof stepIndex !== 'number' ||
    !Number.isInteger(stepIndex) ||
    stepIndex < 0
  ) {
    return { ok: false, error: 'stepIndex must be a whole number from 0' };
  }
  const trimmed = Array.isArray(selectors)
    ? selectors.map((selector) =>
        typeof selector === 'string' ? selector.trim() : ''
      )
    : [];
  if (
    trimmed.length === 0 ||
    trimmed.length > TRIAL_SELECTORS_MAX ||
    trimmed.some(
      (selector) =>
        selector === '' || selector.length > TRIAL_SELECTOR_MAX_LENGTH
    )
  ) {
    return {
      ok: false,
      error: `selectors must be 1 to ${TRIAL_SELECTORS_MAX} selectors, each up to ${TRIAL_SELECTOR_MAX_LENGTH} characters`
    };
  }
  return {
    ok: true,
    request: { stepIndex, selectors: [...new Set(trimmed)] }
  };
}
