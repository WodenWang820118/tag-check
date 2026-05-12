import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildGeminiBackoffRecommendationSummary,
  buildGeminiIntervalRecommendationSummary,
  buildGeminiReviewSessionSummaries,
  buildTimeoutRecommendationSummary,
  createProviderObservationBucketKey,
  getProviderObservabilityStatePath,
  loadProviderObservabilityState,
  recordProviderObservation,
  type ProviderObservation,
} from './provider-observability.ts';

test('provider observability state round-trips through the workspace cache', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-observability-'));

  try {
    assert.match(
      getProviderObservabilityStatePath(tempRoot),
      /\.cache[\\/]reviews[\\/]provider-observability-state\.json$/,
    );

    recordProviderObservation(
      observation({
        callsite: 'checkpoint-review',
        checkpoint: 'plan',
        configuredTimeoutMs: 30_000,
        durationMs: 1_200,
        model: 'claude-sonnet-4.6',
        operation: 'health-probe',
        promptChars: 17,
        provider: 'copilot',
        success: true,
        timedOut: false,
      }),
      tempRoot,
    );

    const state = loadProviderObservabilityState(tempRoot);
    const bucket =
      state.buckets[
        createProviderObservationBucketKey({
          callsite: 'checkpoint-review',
          checkpoint: 'plan',
          model: 'claude-sonnet-4.6',
          operation: 'health-probe',
          provider: 'copilot',
        })
      ];

    assert.equal(bucket?.observations.length, 1);
    assert.equal(bucket?.observations[0]?.promptChars, 17);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('provider observability retains only the most recent 100 observations per bucket', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-observability-cap-'));

  try {
    for (let index = 0; index < 105; index += 1) {
      recordProviderObservation(
        observation({
          callsite: 'checkpoint-review',
          checkpoint: 'implementation',
          configuredTimeoutMs: 30_000,
          durationMs: index,
          model: 'claude-sonnet-4.6',
          operation: 'health-probe',
          promptChars: 17,
          provider: 'copilot',
          recordedAtMs: index,
          success: true,
          timedOut: false,
        }),
        tempRoot,
      );
    }

    const bucket =
      loadProviderObservabilityState(tempRoot).buckets[
        createProviderObservationBucketKey({
          callsite: 'checkpoint-review',
          checkpoint: 'implementation',
          model: 'claude-sonnet-4.6',
          operation: 'health-probe',
          provider: 'copilot',
        })
      ];

    assert.equal(bucket?.observations.length, 100);
    assert.equal(bucket?.observations[0]?.durationMs, 5);
    assert.equal(bucket?.observations.at(-1)?.durationMs, 104);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

test('createProviderObservationBucketKey separates buckets by callsite', () => {
  const checkpointReviewKey = createProviderObservationBucketKey({
    callsite: 'checkpoint-review',
    operation: 'review',
    provider: 'gemini',
  });
  const hybridReviewKey = createProviderObservationBucketKey({
    callsite: 'hybrid-gpt-review',
    operation: 'review',
    provider: 'gemini',
  });

  assert.notEqual(checkpointReviewKey, hybridReviewKey);
});

test('timeout recommendation respects the upper clamp', () => {
  const summary = buildTimeoutRecommendationSummary({
    currentTimeoutMs: 10_000,
    observations: [10_000, 11_000, 12_000, 13_000, 14_000].map((durationMs) =>
      observation({
        callsite: 'checkpoint-review',
        checkpoint: 'test',
        configuredTimeoutMs: 10_000,
        durationMs,
        model: 'claude-sonnet-4.6',
        operation: 'review',
        promptChars: 120,
        provider: 'copilot',
        success: true,
        timedOut: false,
      }),
    ),
  });

  assert.equal(summary.recommendedTimeoutMs, 20_000);
});

test('timeout recommendation rounds up to the nearest 5s increment', () => {
  const summary = buildTimeoutRecommendationSummary({
    currentTimeoutMs: 20_000,
    observations: [5_000, 6_000, 7_000, 8_000, 9_000].map((durationMs) =>
      observation({
        callsite: 'checkpoint-review',
        checkpoint: 'test',
        configuredTimeoutMs: 20_000,
        durationMs,
        model: 'claude-sonnet-4.6',
        operation: 'review',
        promptChars: 120,
        provider: 'copilot',
        success: true,
        timedOut: false,
      }),
    ),
  });

  assert.equal(summary.recommendedTimeoutMs, 15_000);
});

test('timeout recommendation uses successful durations only and rounds up with headroom', () => {
  const summary = buildTimeoutRecommendationSummary({
    currentTimeoutMs: 10_000,
    observations: [1_000, 2_000, 3_000, 4_000, 5_000].map((durationMs) =>
      observation({
        callsite: 'checkpoint-review',
        checkpoint: 'test',
        configuredTimeoutMs: 10_000,
        durationMs,
        model: 'claude-sonnet-4.6',
        operation: 'review',
        promptChars: 120,
        provider: 'copilot',
        success: true,
        timedOut: false,
      }),
    ),
  });

  assert.equal(summary.insufficientData, false);
  assert.equal(summary.p50DurationMs, 3_000);
  assert.equal(summary.p95DurationMs, 5_000);
  assert.equal(summary.recommendedTimeoutMs, 10_000);
});

test('gemini interval recommendation raises the interval when first-attempt capacity errors are frequent', () => {
  const sessions = buildGeminiReviewSessionSummaries(
    Array.from({ length: 10 }, (_, index) =>
      index < 2
        ? [
            observation({
              attempt: 0,
              callsite: 'checkpoint-review',
              capacityError: true,
              checkpoint: 'implementation',
              configuredTimeoutMs: 180_000,
              durationMs: 10_000,
              model: 'gemini-3-flash-preview',
              operation: 'review-attempt',
              promptChars: 50,
              provider: 'gemini',
              sessionId: `session-${index}`,
              success: false,
              timedOut: false,
            }),
            observation({
              attempt: 1,
              callsite: 'checkpoint-review',
              checkpoint: 'implementation',
              configuredTimeoutMs: 180_000,
              durationMs: 12_000,
              model: 'gemini-3-flash-preview',
              operation: 'review-attempt',
              promptChars: 50,
              provider: 'gemini',
              sessionId: `session-${index}`,
              success: true,
              timedOut: false,
            }),
          ]
        : [
            observation({
              attempt: 0,
              callsite: 'checkpoint-review',
              checkpoint: 'implementation',
              configuredTimeoutMs: 180_000,
              durationMs: 9_000,
              model: 'gemini-3-flash-preview',
              operation: 'review-attempt',
              promptChars: 50,
              provider: 'gemini',
              sessionId: `session-${index}`,
              success: true,
              timedOut: false,
            }),
          ],
    ).flat(),
  );

  const summary = buildGeminiIntervalRecommendationSummary({
    currentIntervalMs: 22_000,
    sessions,
  });

  assert.equal(summary.insufficientData, false);
  assert.equal(summary.sessionCount, 10);
  assert.equal(summary.firstAttemptCapacityRate, 0.2);
  assert.equal(summary.recommendedIntervalMs, 32_000);
});

test('gemini interval recommendation uses the middle threshold for modest first-attempt capacity errors', () => {
  const sessions = buildGeminiReviewSessionSummaries(
    Array.from({ length: 10 }, (_, index) =>
      index === 0
        ? [
            observation({
              attempt: 0,
              callsite: 'checkpoint-review',
              capacityError: true,
              checkpoint: 'implementation',
              configuredTimeoutMs: 180_000,
              durationMs: 10_000,
              model: 'gemini-3-flash-preview',
              operation: 'review-attempt',
              promptChars: 50,
              provider: 'gemini',
              sessionId: `session-${index}`,
              success: false,
              timedOut: false,
            }),
            observation({
              attempt: 1,
              callsite: 'checkpoint-review',
              checkpoint: 'implementation',
              configuredTimeoutMs: 180_000,
              durationMs: 12_000,
              model: 'gemini-3-flash-preview',
              operation: 'review-attempt',
              promptChars: 50,
              provider: 'gemini',
              sessionId: `session-${index}`,
              success: true,
              timedOut: false,
            }),
          ]
        : [
            observation({
              attempt: 0,
              callsite: 'checkpoint-review',
              checkpoint: 'implementation',
              configuredTimeoutMs: 180_000,
              durationMs: 9_000,
              model: 'gemini-3-flash-preview',
              operation: 'review-attempt',
              promptChars: 50,
              provider: 'gemini',
              sessionId: `session-${index}`,
              success: true,
              timedOut: false,
            }),
          ],
    ).flat(),
  );

  const summary = buildGeminiIntervalRecommendationSummary({
    currentIntervalMs: 22_000,
    sessions,
  });

  assert.equal(summary.firstAttemptCapacityRate, 0.1);
  assert.equal(summary.recommendedIntervalMs, 27_000);
});

test('gemini interval recommendation keeps the interval unchanged below the first threshold', () => {
  const sessions = buildGeminiReviewSessionSummaries(
    Array.from({ length: 10 }, (_, index) => [
      observation({
        attempt: 0,
        callsite: 'checkpoint-review',
        checkpoint: 'implementation',
        configuredTimeoutMs: 180_000,
        durationMs: 9_000,
        model: 'gemini-3-flash-preview',
        operation: 'review-attempt',
        promptChars: 50,
        provider: 'gemini',
        sessionId: `session-${index}`,
        success: true,
        timedOut: false,
      }),
    ]).flat(),
  );

  const summary = buildGeminiIntervalRecommendationSummary({
    currentIntervalMs: 22_000,
    sessions,
  });

  assert.equal(summary.firstAttemptCapacityRate, 0);
  assert.equal(summary.recommendedIntervalMs, 22_000);
});

test('gemini backoff recommendation scales when capacity retries often require third attempts or exhaust retries', () => {
  const sessions = buildGeminiReviewSessionSummaries([
    ...retrySession('a', true, 2),
    ...retrySession('b', true, 2),
    ...retrySession('c', false, 2),
    ...retrySession('d', true, 1),
    ...retrySession('e', true, 1),
  ]);

  const summary = buildGeminiBackoffRecommendationSummary({
    currentRetryDelaysMs: [20_000, 30_000],
    sessions,
  });

  assert.equal(summary.insufficientData, false);
  assert.equal(summary.retrySessionCount, 5);
  assert.equal(summary.hardRetryRate, 0.6);
  assert.deepEqual(summary.recommendedRetryDelaysMs, [30_000, 45_000]);
});

test('gemini backoff recommendation uses the middle multiplier for moderate hard retry rates', () => {
  const sessions = buildGeminiReviewSessionSummaries([
    ...retrySession('a', true, 2),
    ...retrySession('b', true, 2),
    ...retrySession('c', true, 1),
    ...retrySession('d', true, 1),
    ...retrySession('e', true, 1),
  ]);

  const summary = buildGeminiBackoffRecommendationSummary({
    currentRetryDelaysMs: [20_000, 30_000],
    sessions,
  });

  assert.equal(summary.hardRetryRate, 0.4);
  assert.deepEqual(summary.recommendedRetryDelaysMs, [25_000, 40_000]);
});

test('gemini backoff recommendation keeps the existing schedule when hard retries stay below the threshold', () => {
  const sessions = buildGeminiReviewSessionSummaries([
    ...retrySession('a', true, 2),
    ...retrySession('b', true, 1),
    ...retrySession('c', true, 1),
    ...retrySession('d', true, 1),
    ...retrySession('e', true, 1),
  ]);

  const summary = buildGeminiBackoffRecommendationSummary({
    currentRetryDelaysMs: [20_000, 30_000],
    sessions,
  });

  assert.equal(summary.hardRetryRate, 0.2);
  assert.deepEqual(summary.recommendedRetryDelaysMs, [20_000, 30_000]);
});

function observation(
  input: Partial<ProviderObservation> &
    Pick<
      ProviderObservation,
      | 'callsite'
      | 'configuredTimeoutMs'
      | 'durationMs'
      | 'operation'
      | 'promptChars'
      | 'provider'
      | 'success'
      | 'timedOut'
    >,
): ProviderObservation {
  return {
    errorCategory: null,
    recordedAtMs: input.recordedAtMs ?? 1,
    ...input,
  };
}

function retrySession(
  sessionId: string,
  success: boolean,
  finalAttempt: number,
): ProviderObservation[] {
  const observations: ProviderObservation[] = [];

  for (let attempt = 0; attempt <= finalAttempt; attempt += 1) {
    observations.push(
      observation({
        attempt,
        callsite: 'checkpoint-review',
        capacityError: attempt < finalAttempt || !success,
        checkpoint: 'implementation',
        configuredTimeoutMs: 300_000,
        durationMs: 10_000 + attempt,
        model: 'gemini-2.5-pro',
        operation: 'review-attempt',
        promptChars: 50,
        provider: 'gemini',
        recordedAtMs: attempt + 1,
        sessionId,
        success: success && attempt === finalAttempt,
        timedOut: false,
      }),
    );
  }

  return observations;
}
