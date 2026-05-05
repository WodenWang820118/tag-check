// region Imports

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { main } from './reset.ts';

// endregion

test('reset entrypoint can be imported without running the CLI', () => {
  assert.equal(typeof main, 'function');
});
