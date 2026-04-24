import {
  getModelRateLimitPolicy,
  normalizeGeminiModel
} from '../rate-limit/rate-limit.ts';

// Centralized provider policy keeps timeout and retry decisions out of the CLI
// orchestration paths, where they are harder to audit during reviews.
export type CopilotPolicyOperation =
  | 'health-version'
  | 'health-probe'
  | 'reasoning-help'
  | 'review';
export type GeminiPolicyOperation =
  | 'health-version'
  | 'health-probe'
  | 'review-attempt';

export const COPILOT_HEALTH_TIMEOUT_MS = 30_000;
export const COPILOT_REVIEW_TIMEOUT_MS = 3 * 60 * 1000;
export const COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS = 15_000;

export const GEMINI_HEALTH_TIMEOUT_MS = 45_000;

export function getCopilotPolicyTimeoutMs(
  operation: CopilotPolicyOperation
): number {
  if (operation === 'reasoning-help') {
    return COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS;
  }

  if (operation === 'review') {
    return COPILOT_REVIEW_TIMEOUT_MS;
  }

  return COPILOT_HEALTH_TIMEOUT_MS;
}

export function getGeminiPolicyTimeoutMs(input: {
  model?: string;
  operation: GeminiPolicyOperation;
}): number {
  if (input.operation === 'review-attempt') {
    if (!input.model) {
      throw new Error(
        'Gemini review-attempt policy requires a model to resolve the timeout.'
      );
    }

    return getModelRateLimitPolicy(input.model).requestTimeoutMs;
  }

  return GEMINI_HEALTH_TIMEOUT_MS;
}

export function getGeminiCurrentPolicy(model: string) {
  const normalizedModel = normalizeGeminiModel(model);
  const policy = getModelRateLimitPolicy(normalizedModel);

  return {
    healthTimeoutMs: GEMINI_HEALTH_TIMEOUT_MS,
    model: policy.model,
    requestTimeoutMs: policy.requestTimeoutMs,
    retryDelaysMs: [...policy.retryDelaysMs],
    targetIntervalMs: policy.targetIntervalMs
  };
}
