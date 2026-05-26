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
      new Error('Gemini review timed out for model gemini-3.5-flash-high.')
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
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'gemini';
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

test('runGeminiReview falls back to Gemini CLI only when legacy fallback is explicitly enabled', async () => {
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'legacy-fallback';
  const commands: string[] = [];
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
  } finally {
    if (previous === undefined) {
      delete process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
    } else {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = previous;
    }
  }
});

test('GX_LAW_PREP_REVIEW_GOOGLE_CLI=gemini disables Antigravity preference', async () => {
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'gemini';
  const commands: string[] = [];

  try {
    const review = await runGeminiReview(
      {
        model: 'gemini-3.5-flash-high',
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

test('probeGeminiCliHealth falls back to Gemini CLI health probe when legacy fallback is explicitly enabled', async () => {
  const previous = process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
  process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = 'legacy-fallback';
  const commands: string[] = [];
  const repoRoot = mkdtempSync(
    join(tmpdir(), 'gemini-provider-health-fallback-')
  );

  try {
    const health = await probeGeminiCliHealth(
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
    if (previous === undefined) {
      delete process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI;
    } else {
      process.env.GX_LAW_PREP_REVIEW_GOOGLE_CLI = previous;
    }
    rmSync(repoRoot, { force: true, recursive: true });
  }
});
