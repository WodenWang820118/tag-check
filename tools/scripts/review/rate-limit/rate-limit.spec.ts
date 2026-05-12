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
  saveRateLimitState,
} from './rate-limit.ts';

test('getInterRequestDelayMs waits only for the remaining start-to-start interval', () => {
  const now = Date.UTC(2026, 3, 17, 9, 0, 38);

  assert.equal(
    getInterRequestDelayMs({
      model: 'gemini-2.5-pro',
      nowMs: now,
      lastStartedAtMs: Date.UTC(2026, 3, 17, 9, 0, 5),
    }),
    5000,
  );

  assert.equal(
    getInterRequestDelayMs({
      model: 'gemini-3-flash-preview',
      nowMs: now,
      lastStartedAtMs: Date.UTC(2026, 3, 17, 8, 59, 0),
    }),
    0,
  );
});

test('getRetryDelayMs follows the configured backoff schedule', () => {
  assert.equal(getRetryDelayMs('gemini-2.5-pro', 0), 35000);
  assert.equal(getRetryDelayMs('gemini-2.5-pro', 1), 50000);
  assert.equal(getRetryDelayMs('gemini-2.5-pro', 2), 75000);
  assert.equal(getRetryDelayMs('gemini-2.5-pro', 99), 75000);

  assert.equal(getRetryDelayMs('gemini-3-flash-preview', 0), 20000);
  assert.equal(getRetryDelayMs('gemini-3-flash-preview', 1), 30000);
  assert.equal(getRetryDelayMs('gemini-3-flash-preview', 4), 30000);
  assert.equal(
    getModelRateLimitPolicy('gemini-3.1-flash-preview').model,
    'gemini-3-flash-preview',
  );
});

test('rate-limit state round-trips through the workspace cache', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'review-rate-limit-'));

  try {
    const policy = getModelRateLimitPolicy('gemini-2.5-pro');
    assert.equal(policy.targetIntervalMs, 38000);

    const statePath = getRateLimitStatePath(tempRoot);
    assert.match(statePath, /\.cache[\\/]reviews[\\/]rate-limit-state\.json$/);

    saveRateLimitState(
      {
        models: {
          'gemini-2.5-pro': {
            lastStartedAtMs: 1234,
          },
        },
      },
      tempRoot,
    );

    const restored = loadRateLimitState(tempRoot);
    assert.deepEqual(restored, {
      models: {
        'gemini-2.5-pro': {
          lastStartedAtMs: 1234,
        },
      },
    });
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});
