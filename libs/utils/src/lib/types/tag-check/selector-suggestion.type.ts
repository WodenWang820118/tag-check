import type { ElementCandidate } from './step-failure.type';

/**
 * A page element the model read as the one a failed step meant. Its
 * selectors are facts (each matched only it when the step gave up); the
 * reason is the model's reading and was not checked.
 */
export type SelectorSuggestion = {
  candidate: ElementCandidate;
  reason: string;
};

/** What POST /ai-assist/suggestions/:projectSlug/:eventId returns. */
export type SelectorSuggestionsResponse = {
  /** 0-based. */
  stepIndex: number;
  stepType: string;
  /** The Ollama model that answered. */
  model: string;
  /** How many of the page's candidates the model read. */
  considered: number;
  /** Best first; empty when the model named no element. */
  suggestions: SelectorSuggestion[];
};

/** Body of POST /ai-assist/trials/:projectSlug/:eventId. */
export type SelectorTrialRequest = {
  /** 0-based. */
  stepIndex: number;
  /** The selectors the step tries instead of its own, in order. */
  selectors: string[];
};

/** What a trial run returns: the run it saved. */
export type SelectorTrialResponse = {
  runId: number;
  passed: boolean;
  requestPassed: boolean;
  /** Whether the trial made the request check; missing reads as true. */
  requestChecked?: boolean;
};
