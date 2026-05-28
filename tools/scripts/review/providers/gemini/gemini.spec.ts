import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
      new Error('Antigravity review timed out for model gemini-3.5-flash-high.')
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
        model: 'gemini-3.5-flash-high',
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

test('probeGeminiCliHealth accepts non-empty Antigravity transcript output as available', async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'gemini-provider-health-agy-'));

  try {
    const health = await probeGeminiCliHealth(
      {
        model: 'gemini-3.5-flash-high',
        repoRoot
      },
      {
        acquireLock: async () => () => undefined,
        loadRateLimitState: () => ({ models: {} }),
        readAgyTranscriptOutput: () => 'Antigravity is available.',
        recordObservation() {
          return undefined;
        },
        recordRequestStart() {
          return undefined;
        },
        runCommand: (input) => {
          if (input.args[0] === '--version') {
            return { status: 0, stdout: '1.0.0', stderr: '' };
          }

          return { status: 0, stdout: '', stderr: '' };
        },
        sleep: async () => undefined
      }
    );

    assert.equal(health.available, true);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('runGeminiReview records a successful first attempt with wait-before-start metadata', async () => {
  const recorded: ProviderObservationInput[] = [];

  const review = await runGeminiReview(
    {
      model: 'gemini-3.5-flash-high',
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
      model: 'gemini-3.5-flash-high',
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
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'agy';
  const recorded: ProviderObservationInput[] = [];
  let attempt = 0;
  const timeoutError = new Error('timed out');
  timeoutError.name = 'TimeoutError';

  try {
    const review = await runGeminiReview(
      {
        model: 'gemini-3.5-flash-high',
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
      model: 'gemini-3.5-flash-high',
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
      model: 'gemini-3.5-flash-high',
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
  assert.equal(commands[0]?.args[0], '--log-file');
  assert.match(commands[0]?.args[1] ?? '', /gx-law-prep-agy-/);
  assert.deepEqual(commands[0]?.args.slice(2, 6), [
    '--print',
    'Review this diff.',
    '--print-timeout',
    '300s'
  ]);
  assert.equal(commands[0]?.input, undefined);
});

test('runGeminiReview recovers Antigravity print output from transcript fallback', async () => {
  const commands: Array<{ command: string; args: string[] }> = [];

  const review = await runGeminiReview(
    {
      model: 'gemini-3.5-flash-high',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      loadRateLimitState: () => ({ models: {} }),
      readAgyTranscriptOutput(input) {
        assert.match(input.logFilePath, /gx-law-prep-agy-/);
        return 'Reviewed from transcript.';
      },
      recordObservation() {
        return undefined;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: (input) => {
        commands.push({
          args: input.args,
          command: input.command
        });
        return {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: ''
        };
      },
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed from transcript.');
  assert.equal(commands.length, 1);
  assert.equal(commands[0]?.command, 'agy');
  assert.equal(commands[0]?.args[0], '--log-file');
});

test('runGeminiReview writes oversized Antigravity prompts to a temporary context file', async () => {
  let promptFilePath: string | undefined;
  const longPrompt = 'Review this diff.\n'.repeat(2_000);

  const review = await runGeminiReview(
    {
      model: 'gemini-3.5-flash-high',
      prompt: longPrompt,
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      loadRateLimitState: () => ({ models: {} }),
      readAgyTranscriptOutput: () => 'Reviewed from transcript.',
      recordObservation() {
        return undefined;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: (input) => {
        const promptArg = input.args[3] ?? '';
        const match = /file at (.+?\.md)\./.exec(promptArg);
        promptFilePath = match?.[1];
        assert.match(promptArg, /too large for a safe CLI argument/);
        assert.ok(promptFilePath);
        assert.equal(readFileSync(promptFilePath, 'utf8'), longPrompt);

        return {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: ''
        };
      },
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed from transcript.');
  assert.ok(promptFilePath);
  assert.equal(existsSync(promptFilePath), false);
});

test('runGeminiReview treats Antigravity stderr as diagnostics when stdout is empty', async () => {
  const review = await runGeminiReview(
    {
      model: 'gemini-3.5-flash-high',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo'
    },
    {
      acquireLock: async () => () => undefined,
      getInterRequestDelay: () => 0,
      loadRateLimitState: () => ({ models: {} }),
      readAgyTranscriptOutput: () => 'Reviewed from transcript.',
      recordObservation() {
        return undefined;
      },
      recordRequestStart() {
        return undefined;
      },
      runCommand: () => ({
        error: undefined,
        status: 0,
        stderr: 'Update available.',
        stdout: ''
      }),
      sleep: async () => undefined
    }
  );

  assert.equal(review, 'Reviewed from transcript.');

  await assert.rejects(
    () =>
      runGeminiReview(
        {
          model: 'gemini-3.5-flash-high',
          prompt: 'Review this diff.',
          repoRoot: 'C:/repo'
        },
        {
          acquireLock: async () => () => undefined,
          getInterRequestDelay: () => 0,
          loadRateLimitState: () => ({ models: {} }),
          readAgyTranscriptOutput: () => null,
          recordObservation() {
            return undefined;
          },
          recordRequestStart() {
            return undefined;
          },
          runCommand: () => ({
            error: undefined,
            status: 0,
            stderr: 'Update available.',
            stdout: ''
          }),
          sleep: async () => undefined
        }
      ),
    /Antigravity CLI returned no output/
  );
});

test('runGeminiReview reports empty Antigravity output as actionable provider unavailability', async () => {
  await assert.rejects(
    () =>
      runGeminiReview(
        {
          model: 'gemini-3.5-flash-high',
          prompt: 'Review this diff.',
          repoRoot: 'C:/repo'
        },
        {
          acquireLock: async () => () => undefined,
          getInterRequestDelay: () => 0,
          loadRateLimitState: () => ({ models: {} }),
          readAgyTranscriptOutput: () => null,
          recordObservation() {
            return undefined;
          },
          recordRequestStart() {
            return undefined;
          },
          runCommand: () => ({
            error: undefined,
            status: 0,
            stderr: '',
            stdout: ''
          }),
          sleep: async () => undefined
        }
      ),
    /Antigravity CLI returned no output/
  );
});

test('runGeminiReview throws fail-fast error for legacy or unsupported CLI values', async () => {
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;

  try {
    for (const legacyValue of [
      'gemini',
      'legacy-fallback',
      'agy,gemini',
      'unsupported-val'
    ]) {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = legacyValue;
      await assert.rejects(
        () =>
          runGeminiReview(
            {
              model: 'gemini-3.5-flash-high',
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
              runCommand: () => ({
                error: undefined,
                status: 0,
                stderr: '',
                stdout: 'Reviewed.'
              }),
              sleep: async () => undefined
            }
          ),
        /Legacy Gemini CLI execution is retired|Unsupported review CLI/
      );
    }
  } finally {
    if (previous === undefined) {
      delete process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
    } else {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = previous;
    }
  }
});

test('probeGeminiCliHealth throws fail-fast error for legacy or unsupported CLI values', async () => {
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
  const repoRoot = mkdtempSync(
    join(tmpdir(), 'gemini-provider-health-fail-fast-')
  );

  try {
    for (const legacyValue of [
      'gemini',
      'legacy-fallback',
      'agy,gemini',
      'unsupported-val'
    ]) {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = legacyValue;
      await assert.rejects(
        () =>
          probeGeminiCliHealth(
            {
              model: 'gemini-3.5-flash-high',
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
              runCommand: () => ({
                error: undefined,
                status: 0,
                stderr: '',
                stdout: 'OK.'
              }),
              sleep: async () => undefined
            }
          ),
        /Legacy Gemini CLI execution is retired|Unsupported review CLI/
      );
    }
  } finally {
    if (previous === undefined) {
      delete process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
    } else {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = previous;
    }
    rmSync(repoRoot, { force: true, recursive: true });
  }
});
