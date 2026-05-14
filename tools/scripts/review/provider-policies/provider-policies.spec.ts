import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COPILOT_HEALTH_TIMEOUT_MS,
  COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS,
  COPILOT_REVIEW_TIMEOUT_MS,
  GEMINI_HEALTH_TIMEOUT_MS,
  getCopilotPolicyTimeoutMs,
  getGeminiCurrentPolicy,
  getGeminiPolicyTimeoutMs,
} from './provider-policies.ts';

test('getCopilotPolicyTimeoutMs returns the operation-specific timeout', () => {
  assert.equal(
    getCopilotPolicyTimeoutMs('health-version'),
    COPILOT_HEALTH_TIMEOUT_MS,
  );
  assert.equal(
    getCopilotPolicyTimeoutMs('health-probe'),
    COPILOT_HEALTH_TIMEOUT_MS,
  );
  assert.equal(
    getCopilotPolicyTimeoutMs('reasoning-help'),
    COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS,
  );
  assert.equal(getCopilotPolicyTimeoutMs('review'), COPILOT_REVIEW_TIMEOUT_MS);
});

test('getGeminiPolicyTimeoutMs requires a model for review attempts', () => {
  assert.equal(
    getGeminiPolicyTimeoutMs({ operation: 'health-version' }),
    GEMINI_HEALTH_TIMEOUT_MS,
  );
  assert.throws(
    () => getGeminiPolicyTimeoutMs({ operation: 'review-attempt' }),
    /requires a model/,
  );

  const timeoutMs = getGeminiPolicyTimeoutMs({
    model: 'gemini-3-flash-preview',
    operation: 'review-attempt',
  });

  assert.ok(timeoutMs > GEMINI_HEALTH_TIMEOUT_MS);
});

test('getGeminiCurrentPolicy returns a defensive copy of retry delays', () => {
  const firstPolicy = getGeminiCurrentPolicy('gemini-3-flash-preview');
  firstPolicy.retryDelaysMs.push(999);

  const secondPolicy = getGeminiCurrentPolicy('gemini-3-flash-preview');

  assert.equal(secondPolicy.model, 'gemini-3-flash-preview');
  assert.doesNotThrow(() => assert.notDeepEqual(secondPolicy, firstPolicy));
  assert.equal(secondPolicy.retryDelaysMs.includes(999), false);
});
