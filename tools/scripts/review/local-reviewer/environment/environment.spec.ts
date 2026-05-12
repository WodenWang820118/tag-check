import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  buildWindowsProcessBridgePayload,
  createLocalReviewerDependencies,
  createLocalReviewerEnv,
  resolveLocalReviewerRepoRoot,
} from './environment.ts';

test('resolveLocalReviewerRepoRoot finds the sibling workspace', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-support-'));
  const currentRepo = resolve(workspace, 'gx.law-prep');
  const siblingRepo = resolve(workspace, 'local-reviewer-cli');

  try {
    mkdirSync(currentRepo, { recursive: true });
    mkdirSync(resolve(siblingRepo, 'packages', 'local-reviewer', 'bin'), {
      recursive: true,
    });
    writeFileSync(resolve(currentRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(resolve(siblingRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(
      resolve(
        siblingRepo,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js',
      ),
      '',
      'utf8',
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
      recursive: true,
    });
    writeFileSync(resolve(currentRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(resolve(siblingRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(
      resolve(
        siblingRepo,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js',
      ),
      '',
      'utf8',
    );

    assert.equal(
      resolveLocalReviewerRepoRoot(currentRepo, {
        LOCAL_REVIEWER_CLI_PATH: siblingRepo,
      }),
      siblingRepo,
    );
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('createLocalReviewerEnv injects the Ollama defaults', () => {
  const env = createLocalReviewerEnv(
    {
      PATH: process.env.PATH,
    },
    {
      LOCAL_REVIEWER_OLLAMA_MODEL: 'qwen3:8b',
    },
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
    cwd: 'C:/repo',
  });

  assert.equal(payload.command, 'pnpm.cmd');
  assert.deepEqual(payload.args, [
    'review:implementation',
    '--',
    '--focus',
    'general & risky',
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
      timeoutMs: 30000,
    });

    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.stderr.trim(), '');
  },
);
