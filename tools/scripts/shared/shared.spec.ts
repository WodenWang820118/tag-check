import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { test } from 'vitest';

import {
  getFlagValue,
  hasFlag,
  readRequiredValue,
  stripFlagWithValue,
  stripNpmPassthroughSeparator
} from './cli.ts';
import {
  collectRepoChangedFiles,
  collectRepoDiffText,
  collectRepoHasUntrackedFiles,
  getRepoContext,
  resolveGitCommand,
  runGitTextOrNull,
  runGitTextOrThrow
} from './git.ts';
import {
  isDirectEntrypoint,
  normalizeToolPath,
  resolveWorkspaceRootFromModuleUrl
} from './paths.ts';
import {
  encodePowerShellCommand,
  quoteWindowsArg,
  runBestEffortSyncCommand,
  runSyncCommandOrThrow,
  sanitizeEnv,
  tryRunSyncCommand,
  type CommandResult,
  type SyncCommandRunnerInput
} from './process.ts';

test('path helpers resolve workspace roots and direct entrypoints', () => {
  const moduleUrl = pathToFileURL(
    'C:/repo/tools/scripts/proofshot/proofshot.ts'
  ).href;

  assert.equal(
    normalizeToolPath('.\\tools\\scripts\\proofshot\\proofshot.ts'),
    'tools/scripts/proofshot/proofshot.ts'
  );
  assert.match(resolveWorkspaceRootFromModuleUrl(moduleUrl, 3), /repo$/);
  assert.equal(
    isDirectEntrypoint(moduleUrl, [
      'node',
      'C:/repo/tools/scripts/proofshot/proofshot.ts'
    ]),
    true
  );
  assert.equal(
    isDirectEntrypoint(moduleUrl, ['node', 'C:/repo/other.ts']),
    false
  );
  assert.equal(isDirectEntrypoint(moduleUrl, ['node']), false);
});

test('cli helpers parse small flag sets without owning a parser abstraction', () => {
  const args = stripNpmPassthroughSeparator([
    '--',
    '--project',
    'ng-frontend',
    '--json'
  ]);

  assert.equal(hasFlag(args, '--json'), true);
  assert.deepEqual(stripNpmPassthroughSeparator(['--json']), ['--json']);
  assert.deepEqual(stripNpmPassthroughSeparator(['--json', '--']), [
    '--json',
    '--'
  ]);
  assert.equal(getFlagValue(args, '--project'), 'ng-frontend');
  assert.deepEqual(stripFlagWithValue(args, '--project'), ['--json']);
  assert.equal(readRequiredValue(args, 0, '--project'), 'ng-frontend');
  assert.throws(() => readRequiredValue(['--focus'], 0, '--focus'), /Missing/);
});

test('process helpers preserve command result and utility semantics', () => {
  assert.deepEqual(sanitizeEnv({ A: '1', B: undefined }), { A: '1' });
  assert.equal(quoteWindowsArg('plain'), 'plain');
  assert.equal(quoteWindowsArg(''), '""');
  assert.equal(quoteWindowsArg('two words'), '"two words"');
  assert.equal(quoteWindowsArg('a&b'), '"a&b"');
  assert.equal(
    encodePowerShellCommand('Write-Output ok'),
    Buffer.from('Write-Output ok', 'utf16le').toString('base64')
  );
  assert.doesNotThrow(() =>
    runBestEffortSyncCommand({
      command: process.execPath,
      args: ['--version'],
      cwd: process.cwd(),
      stdio: 'ignore'
    })
  );
  assert.doesNotThrow(() =>
    runSyncCommandOrThrow({
      command: process.execPath,
      args: ['--version'],
      cwd: process.cwd()
    })
  );
  assert.equal(
    tryRunSyncCommand({
      command: process.execPath,
      args: ['--version'],
      cwd: process.cwd()
    }),
    true
  );
  assert.equal(
    tryRunSyncCommand({
      command: 'tag-check-missing-command-for-test',
      args: [],
      cwd: process.cwd()
    }),
    false
  );
  assert.throws(
    () =>
      runSyncCommandOrThrow({
        command: 'tag-check-missing-command-for-test',
        args: [],
        cwd: process.cwd()
      }),
    /tag-check-missing-command-for-test|ENOENT|not recognized|not found/i
  );
});

test('git helpers support null-return and throwing error contracts', () => {
  const runner = (input: SyncCommandRunnerInput): CommandResult => {
    if (input.args.includes('--bad')) {
      return {
        status: 1,
        stderr: 'git failed',
        stdout: ''
      };
    }

    return {
      status: 0,
      stderr: '',
      stdout: 'ok\n'
    };
  };

  assert.equal(
    runGitTextOrNull({ args: ['status'], cwd: '/repo', runner }),
    'ok'
  );
  assert.equal(
    runGitTextOrNull({ args: ['--bad'], cwd: '/repo', runner }),
    null
  );
  assert.equal(
    runGitTextOrThrow({ args: ['status'], cwd: '/repo', runner }).stdout,
    'ok\n'
  );
  assert.throws(
    () => runGitTextOrThrow({ args: ['--bad'], cwd: '/repo', runner }),
    /git failed/
  );
});

test('git helpers collect repository state through an injected runner', () => {
  const runner = (input: SyncCommandRunnerInput): CommandResult => {
    const command = [input.command, ...input.args].join(' ');
    const outputs = new Map<string, string>([
      ['git --version', 'git version 2.0.0\n'],
      ['git rev-parse --show-toplevel', '/repo\n'],
      ['git rev-parse --abbrev-ref HEAD', 'develop\n'],
      ['git rev-parse HEAD', 'abc123\n'],
      [
        'git status --porcelain --untracked-files=all',
        ' M src/index.ts\nR  old.ts -> new.ts\n?? tmp.txt\n'
      ],
      ['git diff --no-color --no-ext-diff', 'diff worktree\n'],
      ['git diff --no-color --no-ext-diff --cached', 'diff staged\n']
    ]);

    return {
      status: outputs.has(command) ? 0 : 1,
      stderr: '',
      stdout: outputs.get(command) ?? ''
    };
  };

  assert.equal(resolveGitCommand({ cwd: '/repo', runner }), 'git');
  assert.deepEqual(getRepoContext({ cwd: '/repo/subdir', runner }), {
    root: '/repo',
    branch: 'develop',
    head: 'abc123',
    dirty: true,
    gitCommand: 'git'
  });
  assert.deepEqual(collectRepoChangedFiles({ repoRoot: '/repo', runner }), [
    'src/index.ts',
    'new.ts',
    'tmp.txt'
  ]);
  assert.equal(
    collectRepoHasUntrackedFiles({ repoRoot: '/repo', runner }),
    true
  );
  assert.equal(
    collectRepoDiffText({ repoRoot: '/repo', runner }),
    'diff worktree\ndiff staged'
  );
});

test('git helpers cover no-git and empty-diff edges', () => {
  const failingRunner = (): CommandResult => ({
    status: 1,
    stderr: '',
    stdout: ''
  });
  const cleanRunner = (input: SyncCommandRunnerInput): CommandResult => ({
    status: 0,
    stderr: '',
    stdout: input.args[0] === 'status' ? ' M src/index.ts\n' : ''
  });

  assert.deepEqual(getRepoContext({ cwd: '/repo', runner: failingRunner }), {
    root: '/repo',
    branch: null,
    head: null,
    dirty: null,
    gitCommand: null
  });
  assert.equal(
    collectRepoHasUntrackedFiles({ repoRoot: '/repo', runner: cleanRunner }),
    false
  );
  assert.equal(
    collectRepoDiffText({ repoRoot: '/repo', runner: cleanRunner }),
    ''
  );
});
