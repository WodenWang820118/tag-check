import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  getInterRequestDelayMs,
  getModelRateLimitPolicy,
  getRateLimitStatePath,
  getRetryDelayMs,
  loadRateLimitState,
  saveRateLimitState
} from './rate-limit.ts';

test('getInterRequestDelayMs waits only for the remaining start-to-start interval', () => {
  const now = Date.UTC(2026, 3, 17, 9, 0, 38);

  assert.equal(
    getInterRequestDelayMs({
      model: 'gemini-3.5-flash-high',
      nowMs: now,
      lastStartedAtMs: Date.UTC(2026, 3, 17, 9, 0, 5)
    }),
    12000
  );

  assert.equal(
    getInterRequestDelayMs({
      model: 'gemini-3.5-flash-high',
      nowMs: now,
      lastStartedAtMs: Date.UTC(2026, 3, 17, 8, 59, 0)
    }),
    0
  );
});

test('getRetryDelayMs follows the configured backoff schedule', () => {
  assert.equal(getRetryDelayMs('gemini-3.5-flash-high', 0), 45000);
  assert.equal(getRetryDelayMs('gemini-3.5-flash-high', 1), 65000);
  assert.equal(getRetryDelayMs('gemini-3.5-flash-high', 2), 95000);
  assert.equal(getRetryDelayMs('gemini-3.5-flash-high', 99), 95000);
  assert.equal(
    getModelRateLimitPolicy('gemini-3.5-flash-high').model,
    'gemini-3.5-flash-high'
  );
  assert.equal(
    getModelRateLimitPolicy('gemini-3.1-flash-preview').model,
    'gemini-3.5-flash-high'
  );
});

test('rate-limit state round-trips through the workspace cache', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'review-rate-limit-'));

  try {
    const policy = getModelRateLimitPolicy('gemini-3.5-flash-high');
    assert.equal(policy.targetIntervalMs, 45000);

    const statePath = getRateLimitStatePath(tempRoot);
    assert.match(statePath, /\.cache[\\/]reviews[\\/]rate-limit-state\.json$/);

    saveRateLimitState(
      {
        models: {
          'gemini-3.5-flash-high': {
            lastStartedAtMs: 1234
          }
        }
      },
      tempRoot
    );

    const restored = loadRateLimitState(tempRoot);
    assert.deepEqual(restored, {
      models: {
        'gemini-3.5-flash-high': {
          lastStartedAtMs: 1234
        }
      }
    });
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});
