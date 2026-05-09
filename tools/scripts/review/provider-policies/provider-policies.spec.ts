import { describe, expect, it } from 'vitest';
import {
  COPILOT_HEALTH_TIMEOUT_MS,
  COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS,
  COPILOT_REVIEW_TIMEOUT_MS,
  GEMINI_HEALTH_TIMEOUT_MS,
  getCopilotPolicyTimeoutMs,
  getGeminiCurrentPolicy,
  getGeminiPolicyTimeoutMs
} from './provider-policies.ts';

describe('getCopilotPolicyTimeoutMs', () => {
  it('returns the reasoning-help timeout for reasoning-help operations', () => {
    expect(getCopilotPolicyTimeoutMs('reasoning-help')).toBe(
      COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS
    );
  });

  it('returns the review timeout for review operations', () => {
    expect(getCopilotPolicyTimeoutMs('review')).toBe(COPILOT_REVIEW_TIMEOUT_MS);
  });

  it('falls back to the health timeout for other operations', () => {
    expect(getCopilotPolicyTimeoutMs('health-version')).toBe(
      COPILOT_HEALTH_TIMEOUT_MS
    );
    expect(getCopilotPolicyTimeoutMs('health-probe')).toBe(
      COPILOT_HEALTH_TIMEOUT_MS
    );
  });
});

describe('getGeminiPolicyTimeoutMs', () => {
  it('returns the health timeout for non-review operations', () => {
    expect(getGeminiPolicyTimeoutMs({ operation: 'health-version' })).toBe(
      GEMINI_HEALTH_TIMEOUT_MS
    );
    expect(getGeminiPolicyTimeoutMs({ operation: 'health-probe' })).toBe(
      GEMINI_HEALTH_TIMEOUT_MS
    );
  });

  it('throws when review-attempt is requested without a model', () => {
    expect(() =>
      getGeminiPolicyTimeoutMs({ operation: 'review-attempt' })
    ).toThrow(/requires a model/);
  });

  it('returns the model-specific request timeout for review-attempt', () => {
    const ms = getGeminiPolicyTimeoutMs({
      operation: 'review-attempt',
      model: 'gemini-2.5-pro'
    });
    expect(typeof ms).toBe('number');
    expect(ms).toBeGreaterThan(0);
  });
});

describe('getGeminiCurrentPolicy', () => {
  it('returns the resolved policy with cloned retry delays', () => {
    const policy = getGeminiCurrentPolicy('gemini-2.5-pro');
    expect(policy.healthTimeoutMs).toBe(GEMINI_HEALTH_TIMEOUT_MS);
    expect(policy.model).toBeTruthy();
    expect(Array.isArray(policy.retryDelaysMs)).toBe(true);
    expect(policy.requestTimeoutMs).toBeGreaterThan(0);

    // Mutating the returned array does not change a subsequent call's result
    policy.retryDelaysMs.push(999_999);
    const fresh = getGeminiCurrentPolicy('gemini-2.5-pro');
    expect(fresh.retryDelaysMs).not.toContain(999_999);
  });
});
