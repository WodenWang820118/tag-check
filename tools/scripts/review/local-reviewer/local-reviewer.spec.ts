import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  getUsageText,
  parseCliArgs,
  writePrefilterOutput,
  type ParsedLocalReviewerCliArgs
} from './local-reviewer.ts';

test('parseCliArgs keeps estimate-only defaults for evaluate', () => {
  const parsed = parseCliArgs(['evaluate']);

  assert.equal(parsed.abSamples, 0);
  assert.equal(parsed.command, 'evaluate');
  assert.equal(parsed.jobs > 0, true);
  assert.deepEqual(parsed.repos, []);
  assert.equal(parsed.rounds, 32);
  assert.equal(parsed.seed, 20260419);
  assert.equal(parsed.smallDiffThresholdChars, 1024);
});

test('parseCliArgs reads repeated repo flags and numeric overrides', () => {
  const parsed = parseCliArgs([
    'evaluate',
    '--rounds',
    '40',
    '--seed',
    '7',
    '--small-diff-threshold-chars',
    '2048',
    '--ab-samples',
    '4',
    '--jobs',
    '3',
    '--repo',
    'gx.go',
    '--repo',
    '../local-reviewer-cli'
  ]);

  assert.deepEqual(parsed, {
    abSamples: 4,
    command: 'evaluate',
    jobs: 3,
    repos: ['gx.go', '../local-reviewer-cli'],
    rounds: 40,
    seed: 7,
    smallDiffThresholdChars: 2048
  } satisfies ParsedLocalReviewerCliArgs);
});

test('getUsageText stays path-agnostic', () => {
  const usage = getUsageText();

  assert.doesNotMatch(usage, /scripts[\\/]/i);
  assert.match(usage, /local-reviewer\.ts/);
});

test('writePrefilterOutput includes hybrid additive fields without breaking key=value output', () => {
  const writes: string[] = [];
  const originalWrite = process.stdout.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    writes.push(
      typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')
    );
    return true;
  }) as typeof process.stdout.write;

  try {
    writePrefilterOutput({
      artifacts: {
        contextPath: '/repo/context.md',
        reportPath: '/repo/report.json',
        reviewContextPath: '/repo/review.md'
      },
      decisionBasis: 'gpt+local',
      gptConfidence: 'medium',
      gptProvider: 'copilot-gpt-5-mini',
      gptRisk: 'low',
      localMode: 'targeted',
      payload: {
        recommended_escalation: false
      },
      recommendedEscalation: false,
      requestedProfiles: ['typescript'],
      reviewContextMode: 'prefilter-summary',
      smallDiffThresholdChars: 1024
    });
  } finally {
    process.stdout.write = originalWrite;
  }

  const output = writes.join('');
  assert.match(output, /^recommended_escalation=false/m);
  assert.match(output, /^gpt_provider=copilot-gpt-5-mini$/m);
  assert.match(output, /^gpt_risk=low$/m);
  assert.match(output, /^gpt_confidence=medium$/m);
  assert.match(output, /^local_mode=targeted$/m);
  assert.match(output, /^requested_profiles=typescript$/m);
  assert.match(output, /^decision_basis=gpt\+local$/m);
  assert.match(output, /"recommended_escalation": false/);
});
