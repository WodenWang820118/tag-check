import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveWindowsPowerShellPath,
  resolveWindowsScriptPath,
  runLocalCliCommand,
} from './local-cli.ts';

test('runLocalCliCommand captures stdout, stderr, and status', () => {
  const result = runLocalCliCommand({
    command: process.execPath,
    args: ['-e', 'process.stdout.write("out"); process.stderr.write("err");'],
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'out');
  assert.equal(result.stderr, 'err');
  assert.equal(result.error, undefined);
});

test('runLocalCliCommand returns non-zero command results without throwing', () => {
  const result = runLocalCliCommand({
    command: process.execPath,
    args: ['-e', 'process.exit(7);'],
  });

  assert.equal(result.status, 7);
  assert.equal(result.error, undefined);
});

test('runLocalCliCommand returns spawn errors for missing commands', () => {
  const result = runLocalCliCommand({
    command: 'definitely-missing-local-cli-command-for-spec',
    args: [],
  });

  assert.equal(result.status, null);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  assert.equal(result.error instanceof Error, true);
});

test('Windows bridge resolvers return null on non-Windows platforms', () => {
  if (process.platform === 'win32') {
    assert.equal(typeof resolveWindowsPowerShellPath(), 'string');
    assert.doesNotThrow(() => resolveWindowsScriptPath('missing-script.ps1'));
    return;
  }

  assert.equal(resolveWindowsPowerShellPath(), null);
  assert.equal(resolveWindowsScriptPath('pnpm.ps1'), null);
});
