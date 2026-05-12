import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import type { ProviderObservationInput } from '../../provider-observability/provider-observability.ts';
import {
  buildCopilotCommandArgs,
  buildCopilotReviewCommandArgs,
  probeCopilotCliHealth,
  runCopilotReview,
} from './copilot.ts';

test('buildCopilotCommandArgs uses non-interactive prompt mode and preserves prompt text', () => {
  const args = buildCopilotCommandArgs({
    experimental: true,
    model: 'gpt-5-mini',
    prompt: 'Review this diff and list three findings.',
  });

  assert.deepEqual(args, [
    '--experimental',
    '-p',
    'Review this diff and list three findings.',
    '--output-format',
    'text',
    '--silent',
    '--mode',
    'plan',
    '--model',
    'gpt-5-mini',
  ]);
  assert.equal(args.includes('--prompt=-'), false);
});

test('buildCopilotCommandArgs can harden health probes with local-only settings', () => {
  const args = buildCopilotCommandArgs({
    disableBuiltinMcps: true,
    disableCustomInstructions: true,
    prompt: 'Reply with exactly OK.',
  });

  assert.deepEqual(args, [
    '-p',
    'Reply with exactly OK.',
    '--output-format',
    'text',
    '--silent',
    '--mode',
    'plan',
    '--no-custom-instructions',
    '--disable-builtin-mcps',
  ]);
});

test('buildCopilotReviewCommandArgs adds high reasoning effort when the CLI supports it', () => {
  const args = buildCopilotReviewCommandArgs(
    {
      model: 'claude-sonnet-4.6',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: new Map(),
      runCommand: (input) => ({
        error: undefined,
        status: 0,
        stderr: '',
        stdout:
          input.args[0] === '--help'
            ? '  --effort, --reasoning-effort <level>'
            : '',
      }),
    },
  );

  assert.deepEqual(args, [
    '--experimental',
    '-p',
    'Review this diff.',
    '--output-format',
    'text',
    '--silent',
    '--mode',
    'plan',
    '--model',
    'claude-sonnet-4.6',
    '--reasoning-effort',
    'high',
  ]);
});

test('buildCopilotReviewCommandArgs uses the effort alias when the CLI only advertises --effort', () => {
  const args = buildCopilotReviewCommandArgs(
    {
      model: 'claude-sonnet-4.6',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: new Map(),
      runCommand: (input) => ({
        error: undefined,
        status: 0,
        stderr: '',
        stdout: input.args[0] === '--help' ? '  --effort <level>' : '',
      }),
    },
  );

  assert.deepEqual(args, [
    '--experimental',
    '-p',
    'Review this diff.',
    '--output-format',
    'text',
    '--silent',
    '--mode',
    'plan',
    '--model',
    'claude-sonnet-4.6',
    '--effort',
    'high',
  ]);
});

test('buildCopilotReviewCommandArgs falls back cleanly when the CLI does not advertise reasoning effort', () => {
  const args = buildCopilotReviewCommandArgs(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: new Map(),
      runCommand: () => ({
        error: undefined,
        status: 0,
        stderr: '',
        stdout: 'Usage: copilot [options]',
      }),
    },
  );

  assert.equal(args.includes('--reasoning-effort'), false);
  assert.equal(args.includes('--effort'), false);
});

test('buildCopilotReviewCommandArgs falls back cleanly when the support probe fails outright', () => {
  const cache = new Map();
  const args = buildCopilotReviewCommandArgs(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: cache,
      runCommand: () => ({
        error: new Error('help failed'),
        status: 1,
        stderr: 'help failed',
        stdout: '',
      }),
    },
  );

  assert.equal(args.includes('--reasoning-effort'), false);
  assert.equal(args.includes('--effort'), false);
  assert.equal(cache.size, 0);
});

test('buildCopilotReviewCommandArgs retries after a transient support-probe failure instead of caching the fallback permanently', () => {
  const cache = new Map<string, '--effort' | '--reasoning-effort' | null>();
  let attempt = 0;
  const runCommand = () => {
    attempt += 1;
    return attempt === 1
      ? {
          error: new Error('help failed'),
          status: 1,
          stderr: 'help failed',
          stdout: '',
        }
      : {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: '  --reasoning-effort <level>',
        };
  };

  const firstArgs = buildCopilotReviewCommandArgs(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: cache,
      runCommand,
    },
  );
  const secondArgs = buildCopilotReviewCommandArgs(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: cache,
      runCommand,
    },
  );

  assert.equal(firstArgs.includes('--reasoning-effort'), false);
  assert.equal(secondArgs.includes('--reasoning-effort'), true);
});

test('runCopilotReview falls back cleanly when the support probe fails', () => {
  const calls: string[][] = [];
  const review = runCopilotReview(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      reasoningEffortSupportCache: new Map(),
      runCommand: (input) => {
        calls.push([...input.args]);
        if (input.args[0] === '--help') {
          return {
            error: new Error('help failed'),
            status: 1,
            stderr: 'help failed',
            stdout: '',
          };
        }

        return {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: 'Reviewed.',
        };
      },
    },
  );

  assert.equal(review, 'Reviewed.');
  const reviewCall = calls.find((entry) => entry.includes('--experimental'));
  assert.ok(reviewCall);
  assert.equal(reviewCall?.includes('--reasoning-effort'), false);
  assert.equal(reviewCall?.includes('--effort'), false);
});

test('runCopilotReview retries without reasoning flags when the review command rejects them', () => {
  const calls: string[][] = [];
  const cache = new Map<string, '--effort' | '--reasoning-effort' | null>();
  const recorded: ProviderObservationInput[] = [];
  let reviewAttempt = 0;
  const review = runCopilotReview(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
    },
    {
      now: (() => {
        let current = 0;
        return () => {
          current += 100;
          return current;
        };
      })(),
      recordObservation(observation) {
        recorded.push(observation);
        return observation;
      },
      reasoningEffortSupportCache: cache,
      runCommand: (input) => {
        calls.push([...input.args]);
        if (input.args[0] === '--help') {
          return {
            error: undefined,
            status: 0,
            stderr: '',
            stdout: '  --reasoning-effort <level>',
          };
        }

        reviewAttempt += 1;
        return reviewAttempt === 1
          ? {
              error: undefined,
              status: 1,
              stderr: 'unknown option --reasoning-effort',
              stdout: '',
            }
          : {
              error: undefined,
              status: 0,
              stderr: '',
              stdout: 'Reviewed after retry.',
            };
      },
    },
  );

  assert.equal(review, 'Reviewed after retry.');
  const reviewCalls = calls.filter((entry) => entry.includes('--experimental'));
  assert.equal(reviewCalls.length, 2);
  assert.equal(reviewCalls[0]?.includes('--reasoning-effort'), true);
  assert.equal(reviewCalls[1]?.includes('--reasoning-effort'), false);
  assert.equal(reviewCalls[1]?.includes('--effort'), false);
  assert.equal(cache.get(resolve('C:/repo')), null);
  assert.equal(recorded.length, 3);
  assert.equal(recorded[0]?.operation, 'reasoning-help');
  assert.equal(recorded[1]?.operation, 'review');
  assert.equal(recorded[1]?.success, false);
  assert.equal(recorded[1]?.errorCategory, 'unsupported-flag');
  assert.equal(recorded[2]?.operation, 'review');
  assert.equal(recorded[2]?.success, true);
});

test('probeCopilotCliHealth keeps the cheap path while runCopilotReview adds high reasoning effort only to review calls', () => {
  const calls: string[][] = [];
  const repoRoot = mkdtempSync(join(tmpdir(), 'copilot-provider-'));
  const runCommand = (input: {
    args: string[];
  }): {
    error?: Error;
    status: number | null;
    stderr: string;
    stdout: string;
  } => {
    calls.push([...input.args]);

    if (input.args[0] === '--version') {
      return { status: 0, stdout: '1.0.0', stderr: '' };
    }

    if (input.args[0] === '--help') {
      return {
        status: 0,
        stdout: '  --effort, --reasoning-effort <level>',
        stderr: '',
      };
    }

    if (input.args.includes('--no-custom-instructions')) {
      return { status: 0, stdout: 'OK.', stderr: '' };
    }

    return { status: 0, stdout: 'Reviewed.', stderr: '' };
  };

  try {
    const health = probeCopilotCliHealth(
      {
        model: 'gpt-5-mini',
        repoRoot,
      },
      {
        runCommand,
      },
    );
    const review = runCopilotReview(
      {
        model: 'gpt-5-mini',
        prompt: 'Review this diff.',
        repoRoot,
      },
      {
        reasoningEffortSupportCache: new Map(),
        runCommand,
      },
    );

    assert.equal(health.available, true);
    assert.equal(review, 'Reviewed.');

    const probeCall = calls.find((entry) =>
      entry.includes('--no-custom-instructions'),
    );
    const reviewCall = calls.find((entry) => entry.includes('--experimental'));
    const helpCalls = calls.filter((entry) => entry[0] === '--help');

    assert.deepEqual(probeCall, [
      '-p',
      'Reply with exactly OK.',
      '--output-format',
      'text',
      '--silent',
      '--mode',
      'plan',
      '--no-custom-instructions',
      '--disable-builtin-mcps',
      '--model',
      'gpt-5-mini',
    ]);
    assert.ok(reviewCall);
    assert.equal(reviewCall?.includes('--reasoning-effort'), true);
    assert.equal(helpCalls.length, 1);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('probeCopilotCliHealth records health-version and health-probe observations with checkpoint telemetry', () => {
  const recorded: ProviderObservationInput[] = [];
  const repoRoot = mkdtempSync(
    join(tmpdir(), 'copilot-provider-observations-'),
  );

  try {
    const health = probeCopilotCliHealth(
      {
        model: 'gpt-5-mini',
        repoRoot,
        telemetryContext: {
          callsite: 'checkpoint-review',
          checkpoint: 'plan',
        },
      },
      {
        now: (() => {
          let current = 0;
          return () => {
            current += 100;
            return current;
          };
        })(),
        recordObservation(observation) {
          recorded.push(observation);
          return observation;
        },
        runCommand: (input) => {
          if (input.args[0] === '--version') {
            return { status: 0, stdout: '1.0.0', stderr: '' };
          }

          return { status: 0, stdout: 'OK.', stderr: '' };
        },
      },
    );

    assert.equal(health.available, true);
    assert.equal(recorded.length, 2);
    assert.equal(recorded[0]?.operation, 'health-version');
    assert.equal(recorded[0]?.callsite, 'checkpoint-review');
    assert.equal(recorded[0]?.checkpoint, 'plan');
    assert.equal(recorded[0]?.success, true);
    assert.equal(recorded[0]?.errorCategory, null);
    assert.equal(recorded[0]?.durationMs, 100);
    assert.equal(recorded[0]?.timedOut, false);
    assert.equal(recorded[1]?.operation, 'health-probe');
    assert.equal(recorded[1]?.callsite, 'checkpoint-review');
    assert.equal(recorded[1]?.checkpoint, 'plan');
    assert.equal(recorded[1]?.success, true);
    assert.equal(recorded[1]?.errorCategory, null);
    assert.equal(recorded[1]?.durationMs, 100);
    assert.equal(recorded[1]?.timedOut, false);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('runCopilotReview records reasoning-help and review observations and preserves hybrid telemetry', () => {
  const recorded: ProviderObservationInput[] = [];

  const review = runCopilotReview(
    {
      model: 'gpt-5-mini',
      prompt: 'Review this diff.',
      repoRoot: 'C:/repo',
      telemetryContext: {
        callsite: 'hybrid-gpt-review',
      },
    },
    {
      now: (() => {
        let current = 0;
        return () => {
          current += 100;
          return current;
        };
      })(),
      recordObservation(observation) {
        recorded.push(observation);
        return observation;
      },
      reasoningEffortSupportCache: new Map(),
      runCommand: (input) => {
        if (input.args[0] === '--help') {
          return {
            error: undefined,
            status: 0,
            stderr: '',
            stdout: '  --reasoning-effort <level>',
          };
        }

        return {
          error: undefined,
          status: 0,
          stderr: '',
          stdout: 'Reviewed.',
        };
      },
    },
  );

  assert.equal(review, 'Reviewed.');
  assert.equal(recorded.length, 2);
  assert.equal(recorded[0]?.operation, 'reasoning-help');
  assert.equal(recorded[0]?.callsite, 'hybrid-gpt-review');
  assert.equal(recorded[0]?.checkpoint, undefined);
  assert.equal(recorded[0]?.success, true);
  assert.equal(recorded[0]?.errorCategory, null);
  assert.equal(recorded[0]?.timedOut, false);
  assert.equal(recorded[1]?.operation, 'review');
  assert.equal(recorded[1]?.callsite, 'hybrid-gpt-review');
  assert.equal(recorded[1]?.checkpoint, undefined);
  assert.equal(recorded[1]?.success, true);
  assert.equal(recorded[1]?.errorCategory, null);
  assert.equal(recorded[1]?.durationMs, 100);
  assert.equal(recorded[1]?.timedOut, false);
});

test('runCopilotReview records review timeouts before failing', () => {
  const recorded: ProviderObservationInput[] = [];
  const timeoutError = new Error('timed out');
  timeoutError.name = 'TimeoutError';
  const repoRoot = resolve('C:/repo');

  assert.throws(
    () =>
      runCopilotReview(
        {
          model: 'gpt-5-mini',
          prompt: 'Review this diff.',
          repoRoot,
          telemetryContext: {
            callsite: 'checkpoint-review',
            checkpoint: 'implementation',
          },
        },
        {
          now: (() => {
            let current = 0;
            return () => {
              current += 100;
              return current;
            };
          })(),
          recordObservation(observation) {
            recorded.push(observation);
            return observation;
          },
          reasoningEffortSupportCache: new Map([[repoRoot, null]]),
          runCommand: () => ({
            error: timeoutError,
            signal: 'SIGTERM',
            status: null,
            stderr: '',
            stdout: '',
          }),
        },
      ),
    /timed out/,
  );

  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.operation, 'review');
  assert.equal(recorded[0]?.callsite, 'checkpoint-review');
  assert.equal(recorded[0]?.checkpoint, 'implementation');
  assert.equal(recorded[0]?.durationMs, 100);
  assert.equal(recorded[0]?.timedOut, true);
  assert.equal(recorded[0]?.errorCategory, 'timeout');
});

test('runCopilotReview does not mark successful timeout-themed output as a timeout', () => {
  const recorded: ProviderObservationInput[] = [];
  const repoRoot = resolve('C:/repo');

  const review = runCopilotReview(
    {
      model: 'gpt-5-mini',
      prompt: 'Review timeout handling.',
      repoRoot,
    },
    {
      now: (() => {
        let current = 0;
        return () => {
          current += 100;
          return current;
        };
      })(),
      recordObservation(observation) {
        recorded.push(observation);
        return observation;
      },
      reasoningEffortSupportCache: new Map([[repoRoot, null]]),
      runCommand: () => ({
        error: undefined,
        status: 0,
        stderr: '',
        stdout: 'Reviewed timeout handling successfully.',
      }),
    },
  );

  assert.equal(review, 'Reviewed timeout handling successfully.');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.operation, 'review');
  assert.equal(recorded[0]?.success, true);
  assert.equal(recorded[0]?.errorCategory, null);
  assert.equal(recorded[0]?.durationMs, 100);
  assert.equal(recorded[0]?.timedOut, false);
});
