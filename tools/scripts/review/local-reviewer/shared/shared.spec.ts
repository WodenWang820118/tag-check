// region Imports

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_EVALUATION_REPO_NAMES,
  HYBRID_PROFILE_ORDER,
  normalizeHybridPath,
} from './shared.ts';

// endregion

test('normalizeHybridPath trims input and normalizes separators', () => {
  assert.equal(
    normalizeHybridPath(' .\\apps\\law-prep-web\\src\\main.ts '),
    'apps/law-prep-web/src/main.ts',
  );
});

test('local reviewer shared defaults keep expected repo and profile coverage', () => {
  assert.deepEqual(
    [...DEFAULT_EVALUATION_REPO_NAMES],
    ['gx.law-prep', 'gx.go', 'local-reviewer-cli'],
  );
  assert.deepEqual(HYBRID_PROFILE_ORDER, [
    'angular',
    'nest',
    'typescript',
    'repo-habits',
    'general',
  ]);
});
