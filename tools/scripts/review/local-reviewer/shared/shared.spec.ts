import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  DEFAULT_OLLAMA_MODEL,
  HYBRID_PROFILE_ORDER,
  median,
  normalizeLocalReviewSeverity,
  normalizeOptionalLineNumber,
  normalizeOptionalText,
  shuffleWithSeed,
  type LocalReviewFinding
} from './shared.ts';

test('local-reviewer shared barrel re-exports representative runtime values', () => {
  assert.equal(DEFAULT_OLLAMA_MODEL, 'qwen3:8b');
  assert.deepEqual(HYBRID_PROFILE_ORDER, [
    'angular',
    'nest',
    'typescript',
    'repo-habits',
    'general'
  ]);
  assert.equal(normalizeLocalReviewSeverity('high'), 'high');
  assert.equal(normalizeLocalReviewSeverity('surprise'), 'info');
  assert.deepEqual(
    [
      normalizeLocalReviewSeverity('critical'),
      normalizeLocalReviewSeverity('medium'),
      normalizeLocalReviewSeverity('low'),
      normalizeLocalReviewSeverity('info')
    ],
    ['critical', 'medium', 'low', 'info']
  );
  assert.equal(normalizeOptionalText('  detail  '), 'detail');
  assert.equal(normalizeOptionalText('   '), null);
  assert.equal(normalizeOptionalLineNumber('12'), 12);
  assert.equal(normalizeOptionalLineNumber(0), null);
  assert.equal(median([1, 7, 3]), 3);
  assert.equal(median([1, 3, 8, 10]), 6);
  assert.equal(median([]), 0);
  assert.deepEqual(shuffleWithSeed([1, 2, 3], 1).sort(), [1, 2, 3]);
});

test('local-reviewer shared barrel keeps type exports available', () => {
  const finding = {
    severity: 'info',
    title: 'Example',
    detail: 'Type-only barrel assertion.',
    file_path: null,
    line: null,
    recommendation: null,
    profile: null,
    rationale: null,
    evidence: null
  } satisfies LocalReviewFinding;

  assert.equal(finding.severity, 'info');
});
