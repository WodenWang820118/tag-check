import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  CommandResult,
  LocalReviewerDependencies
} from '../shared/shared.ts';
import {
  buildCheckpointReviewContext,
  collectChangedFiles,
  collectDiffText
} from './diff-context.ts';

test('buildCheckpointReviewContext includes an explicit changed files section before the diff', () => {
  const context = buildCheckpointReviewContext({
    changedFiles: ['apps/law-prep-web/src/app/app.component.ts'],
    diffText:
      'diff --git a/apps/law-prep-web/src/app/app.component.ts b/apps/law-prep-web/src/app/app.component.ts',
    sample: {
      baseRef: 'abc123',
      commit: 'def456',
      committedAtEpoch: 0,
      fileCount: 1,
      kind: 'small-ts',
      repoName: 'gx.law-prep',
      repoRoot: 'C:/software-dev/gx.law-prep',
      subject: 'Update copy',
      totalChangedLines: 4
    }
  });

  assert.match(
    context,
    /Changed files:\n- apps\/law-prep-web\/src\/app\/app\.component\.ts\n\nDiff to review:/
  );
});

test('buildCheckpointReviewContext preserves the section shape for empty changed files', () => {
  const context = buildCheckpointReviewContext({
    changedFiles: [],
    diffText: '',
    sample: {
      baseRef: 'abc123',
      commit: 'def456',
      committedAtEpoch: 0,
      fileCount: 0,
      kind: 'general',
      repoName: 'gx.law-prep',
      repoRoot: 'C:/software-dev/gx.law-prep',
      subject: 'Empty diff',
      totalChangedLines: 0
    }
  });

  assert.match(context, /Changed files:\n\nDiff to review:\n$/);
});

test('buildCheckpointReviewContext renders metadata, normalized files and the trimmed diff', () => {
  const context = buildCheckpointReviewContext({
    changedFiles: ['src/a.ts', 'src\\b.ts'],
    diffText: '  diff body  \n',
    sample: {
      baseRef: 'main',
      commit: 'cafe123',
      committedAtEpoch: 0,
      fileCount: 2,
      kind: 'small-ts',
      repoName: 'demo',
      repoRoot: '/repo',
      subject: 'feat: do thing',
      totalChangedLines: 10
    }
  });

  assert.equal(
    context,
    [
      'Repository: demo',
      'Commit: cafe123',
      'Base ref: main',
      'Head ref: cafe123',
      'Subject: feat: do thing',
      'Kind: small-ts',
      '',
      'Changed files:',
      '- src/a.ts',
      '- src/b.ts',
      '',
      'Diff to review:',
      'diff body'
    ].join('\n')
  );
});

test('collectDiffText diffs the index when staged and trims the output', () => {
  const { calls, dependencies } = createDependencies([
    { status: 0, stderr: '', stdout: '  patch text\n' }
  ]);

  const result = collectDiffText({
    dependencies,
    repoRoot: '/repo',
    staged: true
  });

  assert.equal(result, 'patch text');
  assert.deepEqual(calls[0], [
    'diff',
    '--cached',
    '--no-color',
    '--unified=3',
    '--no-ext-diff'
  ]);
});

test('collectDiffText passes the ref range and drops empty positionals', () => {
  const ranged = createDependencies([{ status: 0, stderr: '', stdout: '' }]);
  collectDiffText({
    baseRef: 'main',
    dependencies: ranged.dependencies,
    headRef: 'feature',
    repoRoot: '/repo',
    staged: false
  });
  assert.deepEqual(ranged.calls[0], [
    'diff',
    '--no-color',
    '--unified=3',
    'main',
    'feature',
    '--no-ext-diff'
  ]);

  const bare = createDependencies([{ status: 0, stderr: '', stdout: '' }]);
  collectDiffText({
    dependencies: bare.dependencies,
    repoRoot: '/repo',
    staged: false
  });
  assert.deepEqual(bare.calls[0], [
    'diff',
    '--no-color',
    '--unified=3',
    '--no-ext-diff'
  ]);
});

test('collectChangedFiles splits stdout on newlines, trims and drops empties', () => {
  const { dependencies } = createDependencies([
    { status: 0, stderr: '', stdout: 'a.ts\r\n  b.ts \n\n c.ts\n' }
  ]);

  assert.deepEqual(
    collectChangedFiles({ dependencies, repoRoot: '/repo', staged: true }),
    ['a.ts', 'b.ts', 'c.ts']
  );
});

test('collectChangedFiles lists names from the index when staged and from the refs otherwise', () => {
  const staged = createDependencies([{ status: 0, stderr: '', stdout: '' }]);
  collectChangedFiles({
    dependencies: staged.dependencies,
    repoRoot: '/repo',
    staged: true
  });
  assert.deepEqual(staged.calls[0], ['diff', '--cached', '--name-only']);

  const ranged = createDependencies([{ status: 0, stderr: '', stdout: '' }]);
  collectChangedFiles({
    baseRef: 'main',
    dependencies: ranged.dependencies,
    headRef: 'HEAD',
    repoRoot: '/repo',
    staged: false
  });
  assert.deepEqual(ranged.calls[0], ['diff', '--name-only', 'main', 'HEAD']);
});

function createDependencies(responses: CommandResult[]): {
  calls: string[][];
  dependencies: LocalReviewerDependencies;
} {
  const calls: string[][] = [];
  let index = 0;

  return {
    calls,
    dependencies: {
      now: () => new Date('2024-01-01T00:00:00Z'),
      runProcess: (input) => {
        calls.push(input.args);
        const response = responses[index] ?? {
          status: 0,
          stderr: '',
          stdout: ''
        };
        index += 1;
        return response;
      }
    }
  };
}
