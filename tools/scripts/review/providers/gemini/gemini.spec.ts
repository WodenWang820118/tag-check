import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import type { ProviderObservationInput } from '../../provider-observability/provider-observability.ts';
import {
  isGeminiUnavailableError,
  probeGeminiCliHealth,
  runGeminiReview
} from './gemini.ts';

test('isGeminiUnavailableError treats exhausted review timeouts as retryable provider unavailability', () => {
  assert.equal(
    isGeminiUnavailableError(
      new Error('Gemini review timed out for model gemini-3-flash-preview.')
    ),
    true
  );
  assert.equal(isGeminiUnavailableError(new Error('ETIMEDOUT')), true);
});

test('probeGeminiCliHealth records health-version and health-probe observations with checkpoint telemetry', async () => {
  const recorded: ProviderObservationInput[] = [];
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
          recorded.push(observation);
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
  const recorded: ProviderObservationInput[] = [];

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
        recorded.push(observation);
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
  const recorded: ProviderObservationInput[] = [];
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
        recorded.push(observation);
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
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'gemini';
  const recorded: ProviderObservationInput[] = [];
  let attempt = 0;
  const timeoutError = new Error('timed out');
  timeoutError.name = 'TimeoutError';

  try {
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
          recorded.push(observation);
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
  } finally {
    if (previous === undefined) {
      delete process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
    } else {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = previous;
    }
  }
});

test('runGeminiReview does not mark successful timeout-themed output as a timeout', async () => {
  const recorded: ProviderObservationInput[] = [];

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
        recorded.push(observation);
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

test('runGeminiReview prefers Antigravity CLI print mode while preserving gemini provider alias', async () => {
  const commands: Array<{ command: string; args: string[]; input?: string }> =
    [];

  const review = await runGeminiReview(
    {
      model: 'gemini-3-flash-preview',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      loadRateLimitState: () => ({ models: {} }),
      recordObservation() {
        return undefined;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: (input) => {
        commands.push({
          args: input.args,
          command: input.command,
          input: input.input
        });
        return {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: 'Reviewed by agy.'
        };
      },
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed by agy.');
  assert.equal(commands.length, 1);
  assert.equal(commands[0]?.command, 'agy');
  assert.deepEqual(commands[0]?.args.slice(0, 3), [
    '--print',
    '--print-timeout',
    '30s'
  ]);
  assert.equal(commands[0]?.args.at(-1), 'Review this diff.');
  assert.equal(commands[0]?.input, undefined);
});

test('runGeminiReview falls back to Gemini CLI when Antigravity CLI is unavailable', async () => {
  const commands: string[] = [];
  const timeoutError = new Error('timed out');
  timeoutError.name = 'TimeoutError';

  const review = await runGeminiReview(
    {
      model: 'gemini-3-flash-preview',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      loadRateLimitState: () => ({ models: {} }),
      recordObservation() {
        return undefined;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: (input) => {
        commands.push(input.command);
        if (input.command === 'agy') {
          return {
            error: timeoutError,
            signal: 'SIGTERM',
            status: null,
            stderr: '',
            stdout: ''
          };
        }

        assert.equal(input.command, 'gemini');
        assert.equal(input.windowsScriptName, 'gemini.ps1');
        assert.equal(input.input, 'Review this diff.');
        return {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: 'Reviewed by gemini.'
        };
      },
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed by gemini.');
  assert.deepEqual(commands, ['agy', 'gemini']);
});

test('GX_LAW_PREP_REVIEW_GOOGLE_CLI=gemini disables Antigravity preference', async () => {
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'gemini';
  const commands: string[] = [];

  try {
    const review = await runGeminiReview(
      {
        model: 'gemini-2.5-pro',
        prompt: 'Review this plan.',
        repoRoot: 'C:/repo'
      },
      {
        acquireLock: async () => () => undefined,
        getInterRequestDelay: () => 0,
        loadRateLimitState: () => ({ models: {} }),
        recordObservation() {
          return undefined;
        },
        recordRequestStart() {
          return undefined;
        },
        runCommand: (input) => {
          commands.push(input.command);
          return {
            error: undefined,
            status: 0,
            stderr: '',
            stdout: 'Reviewed by forced gemini.'
          };
        },
        sleep: async () => undefined
      }
    );

    assert.equal(review, 'Reviewed by forced gemini.');
    assert.deepEqual(commands, ['gemini']);
  } finally {
    if (previous === undefined) {
      delete process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
    } else {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = previous;
    }
  }
});

test('probeGeminiCliHealth falls back to Gemini CLI health probe when Antigravity CLI is missing', async () => {
  const commands: string[] = [];
  const repoRoot = mkdtempSync(
    join(tmpdir(), 'gemini-provider-health-fallback-')
  );

  try {
    const health = await probeGeminiCliHealth(
      {
        model: 'gemini-2.5-pro',
        repoRoot
      },
      {
        acquireLock: async () => () => undefined,
        loadRateLimitState: () => ({ models: {} }),
        recordObservation() {
          return undefined;
        },
        recordRequestStart() {
          return undefined;
        },
        runCommand: (input) => {
          commands.push(`${input.command}:${input.args[0]}`);
          if (input.command === 'agy') {
            return {
              error: new Error('ENOENT'),
              status: null,
              stderr: '',
              stdout: ''
            };
          }

          return {
            error: undefined,
            status: 0,
            stderr: '',
            stdout: input.args[0] === '--version' ? '0.42.0' : 'OK.'
          };
        },
        sleep: async () => undefined
      }
    );

    assert.equal(health.available, true);
    assert.deepEqual(commands, [
      'agy:--version',
      'gemini:--version',
      'gemini:--model'
    ]);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});
