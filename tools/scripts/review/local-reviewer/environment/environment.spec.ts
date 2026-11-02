import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  buildWindowsProcessBridgePayload,
  createLocalReviewerDependencies,
  createLocalReviewerEnv,
  resolveLocalReviewerRepoRoot
} from './environment.ts';

test('resolveLocalReviewerRepoRoot finds the sibling workspace', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-support-'));
  const currentRepo = resolve(workspace, 'gx.law-prep');
  const siblingRepo = resolve(workspace, 'local-reviewer-cli');

  try {
    mkdirSync(currentRepo, { recursive: true });
    mkdirSync(resolve(siblingRepo, 'packages', 'local-reviewer', 'bin'), {
      recursive: true
    });
    writeFileSync(resolve(currentRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(resolve(siblingRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(
      resolve(
        siblingRepo,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js'
      ),
      '',
      'utf8'
    );

    assert.equal(resolveLocalReviewerRepoRoot(currentRepo), siblingRepo);
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('resolveLocalReviewerRepoRoot respects LOCAL_REVIEWER_CLI_PATH overrides', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-support-env-'));
  const currentRepo = resolve(workspace, 'gx.law-prep');
  const siblingRepo = resolve(workspace, 'external', 'local-reviewer-cli');

  try {
    mkdirSync(currentRepo, { recursive: true });
    mkdirSync(resolve(siblingRepo, 'packages', 'local-reviewer', 'bin'), {
      recursive: true
    });
    writeFileSync(resolve(currentRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(resolve(siblingRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(
      resolve(
        siblingRepo,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js'
      ),
      '',
      'utf8'
    );

    assert.equal(
      resolveLocalReviewerRepoRoot(currentRepo, {
        LOCAL_REVIEWER_CLI_PATH: siblingRepo
      }),
      siblingRepo
    );
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('createLocalReviewerEnv injects the Ollama defaults', () => {
  const env = createLocalReviewerEnv(
    {
      PATH: process.env.PATH
    },
    {
      LOCAL_REVIEWER_OLLAMA_MODEL: 'qwen3:8b'
    }
  );

  assert.equal(env.LOCAL_REVIEWER_RUNTIME, 'ollama');
  assert.equal(env.LOCAL_REVIEWER_DEFAULT_MODEL, 'qwen3:8b');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_MODEL, 'qwen3:8b');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_THINK, 'false');
});

test('buildWindowsProcessBridgePayload preserves command metadata without shell flattening', () => {
  const payload = buildWindowsProcessBridgePayload({
    command: 'pnpm.cmd',
    args: ['review:implementation', '--', '--focus', 'general & risky'],
    cwd: 'C:/repo'
  });

  assert.equal(payload.command, 'pnpm.cmd');
  assert.deepEqual(payload.args, [
    'review:implementation',
    '--',
    '--focus',
    'general & risky'
  ]);
  assert.equal(payload.cwd, 'C:/repo');
});

test(
  'createLocalReviewerDependencies can execute pnpm.cmd on Windows without cmd.exe shell flattening',
  { skip: process.platform !== 'win32' },
  () => {
    const dependencies = createLocalReviewerDependencies();
    const result = dependencies.runProcess({
      command: 'pnpm.cmd',
      args: ['--version'],
      cwd: process.cwd(),
      env: { PATH: process.env.PATH },
      timeoutMs: 30000
    });

    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.stderr.trim(), '');
  }
);

test('buildWindowsProcessBridgePayload defaults cwd to process.cwd()', () => {
  const payload = buildWindowsProcessBridgePayload({
    args: ['--flag', 'value'],
    command: 'pnpm.cmd'
  });

  assert.equal(payload.cwd, process.cwd());
});

test('buildWindowsProcessBridgePayload copies args instead of retaining the caller array', () => {
  const args = ['a', 'b'];
  const payload = buildWindowsProcessBridgePayload({ args, command: 'x' });

  assert.notEqual(payload.args, args);
  args.push('c');
  assert.deepEqual(payload.args, ['a', 'b']);
});

test('createLocalReviewerEnv fills every LOCAL_REVIEWER default for an empty base env', () => {
  const env = createLocalReviewerEnv({});

  assert.equal(env.LOCAL_REVIEWER_RUNTIME, 'ollama');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_HOST, 'http://127.0.0.1:11434');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE, '10m');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_MODEL, 'qwen3:8b');
  assert.equal(env.LOCAL_REVIEWER_DEFAULT_MODEL, 'qwen3:8b');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_THINK, 'false');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS, '120000');
});

test('createLocalReviewerEnv keeps base env values and lets overrides win', () => {
  const kept = createLocalReviewerEnv({
    LOCAL_REVIEWER_OLLAMA_HOST: 'http://other:1',
    LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE: '1h',
    LOCAL_REVIEWER_OLLAMA_THINK: 'true',
    LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS: '60000',
    LOCAL_REVIEWER_RUNTIME: 'foundry'
  });
  assert.equal(kept.LOCAL_REVIEWER_RUNTIME, 'foundry');
  assert.equal(kept.LOCAL_REVIEWER_OLLAMA_HOST, 'http://other:1');
  assert.equal(kept.LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE, '1h');
  assert.equal(kept.LOCAL_REVIEWER_OLLAMA_THINK, 'true');
  assert.equal(kept.LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS, '60000');

  const overridden = createLocalReviewerEnv(
    { LOCAL_REVIEWER_RUNTIME: 'ollama' },
    { LOCAL_REVIEWER_RUNTIME: 'foundry' }
  );
  assert.equal(overridden.LOCAL_REVIEWER_RUNTIME, 'foundry');
});

test('createLocalReviewerEnv resolves the Ollama model from overrides, then base env', () => {
  const ollamaOverride = createLocalReviewerEnv(
    { LOCAL_REVIEWER_DEFAULT_MODEL: 'base-default' },
    { LOCAL_REVIEWER_OLLAMA_MODEL: 'override-model' }
  );
  assert.equal(ollamaOverride.LOCAL_REVIEWER_OLLAMA_MODEL, 'override-model');
  assert.equal(ollamaOverride.LOCAL_REVIEWER_DEFAULT_MODEL, 'base-default');

  const defaultOverride = createLocalReviewerEnv(
    {},
    { LOCAL_REVIEWER_DEFAULT_MODEL: 'overridden-default' }
  );
  assert.equal(
    defaultOverride.LOCAL_REVIEWER_OLLAMA_MODEL,
    'overridden-default'
  );
  assert.equal(
    defaultOverride.LOCAL_REVIEWER_DEFAULT_MODEL,
    'overridden-default'
  );

  const baseOllama = createLocalReviewerEnv({
    LOCAL_REVIEWER_DEFAULT_MODEL: 'base-default',
    LOCAL_REVIEWER_OLLAMA_MODEL: 'base-ollama'
  });
  assert.equal(baseOllama.LOCAL_REVIEWER_OLLAMA_MODEL, 'base-ollama');
});

test('createLocalReviewerEnv preserves unrelated base env keys', () => {
  const env = createLocalReviewerEnv({ HOME: '/home/me', PATH: '/usr/bin' });

  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.HOME, '/home/me');
});
