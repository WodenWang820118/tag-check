import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';

import { probeGeminiCliHealth, runGeminiReview } from './gemini.ts';

test('probeGeminiCliHealth records health-version and health-probe observations with checkpoint telemetry', async () => {
  const recorded: Array<Record<string, unknown>> = [];
  const repoRoot = mkdtempSync(join(tmpdir(), 'gemini-provider-health-'));

  try {
    const health = await probeGeminiCliHealth(
      {
        model: 'gemini-2.5-pro',
        repoRoot,
        telemetryContext: {
          callsite: 'checkpoint-review',
          checkpoint: 'test'
        }
      },
      {
        acquireLock: async () => () => undefined,
        loadRateLimitState: () => ({ models: {} }),
        recordObservation(observation) {
          recorded.push(observation as Record<string, unknown>);
          return observation;
        },
        recordRequestStart() {
          return undefined;
        },
        runCommand: (input) => {
          if (input.args[0] === '--version') {
            return { status: 0, stdout: '1.0.0', stderr: '' };
          }

          return { status: 0, stdout: 'OK.', stderr: '' };
        },
        sleep: async () => undefined
      }
    );

    assert.equal(health.available, true);
    assert.equal(recorded.length, 2);
    assert.equal(recorded[0]?.operation, 'health-version');
    assert.equal(recorded[1]?.operation, 'health-probe');
    assert.equal(recorded[1]?.checkpoint, 'test');
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('runGeminiReview records a successful first attempt with wait-before-start metadata', async () => {
  const recorded: Array<Record<string, unknown>> = [];

  const review = await runGeminiReview(
    {
      model: 'gemini-3-flash-preview',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
      telemetryContext: {
        callsite: 'checkpoint-review',
        checkpoint: 'implementation'
      }
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 1_500,
      loadRateLimitState: () => ({ models: {} }),
      recordObservation(observation) {
        recorded.push(observation as Record<string, unknown>);
        return observation;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: () => ({
        error: undefined,
        status: 0,
        stderr: '',
        stdout: 'Reviewed.'
      }),
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed.');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.operation, 'review-attempt');
  assert.equal(recorded[0]?.attempt, 0);
  assert.equal(recorded[0]?.waitBeforeStartMs, 1_500);
  assert.equal(recorded[0]?.success, true);
});

test('runGeminiReview records capacity-triggered retries with retry delay metadata', async () => {
  const recorded: Array<Record<string, unknown>> = [];
  let attempt = 0;

  const review = await runGeminiReview(
    {
      model: 'gemini-3-flash-preview',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
      telemetryContext: {
        callsite: 'checkpoint-review',
        checkpoint: 'implementation'
      }
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      getRetryDelay: () => 20_000,
      loadRateLimitState: () => ({ models: {} }),
      recordObservation(observation) {
        recorded.push(observation as Record<string, unknown>);
        return observation;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: () => {
        attempt += 1;
        return attempt === 1
          ? {
              error: undefined,
              status: 1,
              stderr: '429 MODEL_CAPACITY_EXHAUSTED',
              stdout: ''
            }
          : {
              error: undefined,
              status: 0,
              stderr: '',
              stdout: 'Reviewed.'
            };
      },
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed.');
  assert.equal(recorded.length, 2);
  assert.equal(recorded[0]?.capacityError, true);
  assert.equal(recorded[0]?.retryDelayMs, 20_000);
  assert.equal(recorded[1]?.success, true);
  assert.equal(recorded[0]?.sessionId, recorded[1]?.sessionId);
});

test('runGeminiReview records timeout retries before succeeding', async () => {
  const recorded: Array<Record<string, unknown>> = [];
  let attempt = 0;
  const timeoutError = new Error('timed out');
  timeoutError.name = 'TimeoutError';

  const review = await runGeminiReview(
    {
      model: 'gemini-2.5-pro',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      getRetryDelay: () => 35_000,
      loadRateLimitState: () => ({ models: {} }),
      recordObservation(observation) {
        recorded.push(observation as Record<string, unknown>);
        return observation;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: () => {
        attempt += 1;
        return attempt === 1
          ? {
              error: timeoutError,
              signal: 'SIGTERM',
              status: null,
              stderr: '',
              stdout: ''
            }
          : {
              error: undefined,
              status: 0,
              stderr: '',
              stdout: 'Reviewed.'
            };
      },
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed.');
  assert.equal(recorded.length, 2);
  assert.equal(recorded[0]?.timedOut, true);
  assert.equal(recorded[0]?.retryDelayMs, 35_000);
  assert.equal(recorded[1]?.success, true);
});

test('runGeminiReview does not mark successful timeout-themed output as a timeout', async () => {
  const recorded: Array<Record<string, unknown>> = [];

  const review = await runGeminiReview(
    {
      model: 'gemini-2.5-pro',
      prompt: 'Review timeout handling.',
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      loadRateLimitState: () => ({ models: {} }),
      recordObservation(observation) {
        recorded.push(observation as Record<string, unknown>);
        return observation;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: () => ({
        error: undefined,
        status: 0,
        stderr: '',
        stdout: 'Timeout handling review completed successfully.'
      }),
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Timeout handling review completed successfully.');
  assert.equal(recorded[0]?.timedOut, false);
});
