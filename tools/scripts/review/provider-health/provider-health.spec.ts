import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  cacheProviderHealth,
  createProviderHealthCacheKey,
  getCachedProviderHealth,
  getProviderHealthStatePath,
} from './provider-health.ts';

test('provider health cache keys include the model when present', () => {
  assert.equal(createProviderHealthCacheKey('copilot'), 'copilot');
  assert.equal(
    createProviderHealthCacheKey('gemini', 'gemini-3-flash-preview'),
    'gemini:gemini-3-flash-preview',
  );
});

test('provider health cache round-trips healthy and unhealthy entries', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'provider-health-'));

  try {
    assert.match(
      getProviderHealthStatePath(tempRoot),
      /\.cache[\\/]reviews[\\/]provider-health-state\.json$/,
    );

    cacheProviderHealth(
      'gemini',
      'gemini-3-flash-preview',
      {
        available: true,
        checkedAtMs: 1_000,
      },
      tempRoot,
    );

    cacheProviderHealth(
      'copilot',
      undefined,
      {
        available: false,
        checkedAtMs: 2_000,
        reason: 'quota exhausted',
      },
      tempRoot,
    );

    assert.deepEqual(
      getCachedProviderHealth(
        'gemini',
        'gemini-3-flash-preview',
        tempRoot,
        1_500,
      ),
      {
        available: true,
        checkedAtMs: 1_000,
        source: 'cache',
      },
    );

    assert.deepEqual(
      getCachedProviderHealth('copilot', undefined, tempRoot, 2_500),
      {
        available: false,
        checkedAtMs: 2_000,
        reason: 'quota exhausted',
        source: 'cache',
      },
    );
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});
