import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectChangedFiles,
  collectDiffText,
  resolveEvaluationRepoTarget
} from './git-utils.ts';
import type {
  CommandResult,
  LocalReviewerDependencies
} from '../shared/shared.ts';

interface RecordedCall {
  args: string[];
  command: string;
  cwd: string;
}

function makeDependencies(responses: CommandResult[]): {
  calls: RecordedCall[];
  dependencies: LocalReviewerDependencies;
} {
  const calls: RecordedCall[] = [];
  let index = 0;
  const dependencies: LocalReviewerDependencies = {
    now: () => new Date('2024-01-01T00:00:00Z'),
    runProcess: (input) => {
      calls.push({
        args: input.args,
        command: input.command,
        cwd: input.cwd
      });
      const response = responses[index] ?? {
        status: 0,
        stderr: '',
        stdout: ''
      };
      index += 1;
      return response;
    }
  };
  return { calls, dependencies };
}

describe('resolveEvaluationRepoTarget', () => {
  it('returns a sibling root when the input is a known repo name', () => {
    const result = resolveEvaluationRepoTarget(
      '/work/tag-check',
      'other-repo',
      ['other-repo']
    );
    expect(result.name).toBe('other-repo');
    expect(result.root).toBe(resolve('/work/tag-check', '..', 'other-repo'));
  });

  it('treats unknown inputs as paths relative to the current repo root', () => {
    const result = resolveEvaluationRepoTarget('/work/tag-check', 'sub/dir', [
      'known'
    ]);
    expect(result.root).toBe(resolve('/work/tag-check', 'sub/dir'));
    expect(result.name).toBe('dir');
  });

  it('uses the basename of the resolved path as the repo name', () => {
    const result = resolveEvaluationRepoTarget(
      '/work/tag-check',
      '../neighbour',
      []
    );
    expect(result.name).toBe('neighbour');
  });
});

describe('collectDiffText', () => {
  it('uses git diff --cached when staged is true and trims output', () => {
    const { calls, dependencies } = makeDependencies([
      { status: 0, stderr: '', stdout: '  patch text\n' }
    ]);
    const result = collectDiffText({
      dependencies,
      repoRoot: '/repo',
      staged: true
    });
    expect(result).toBe('patch text');
    expect(calls[0]?.args).toEqual([
      'diff',
      '--cached',
      '--no-color',
      '--unified=3',
      '--no-ext-diff'
    ]);
  });

  it('passes baseRef and headRef when diffing a range, dropping empty positionals', () => {
    const { calls, dependencies } = makeDependencies([
      { status: 0, stderr: '', stdout: '' }
    ]);
    collectDiffText({
      baseRef: 'main',
      dependencies,
      headRef: 'feature',
      repoRoot: '/repo',
      staged: false
    });
    expect(calls[0]?.args).toEqual([
      'diff',
      '--no-color',
      '--unified=3',
      'main',
      'feature',
      '--no-ext-diff'
    ]);
  });

  it('omits empty ref placeholders when refs are not supplied', () => {
    const { calls, dependencies } = makeDependencies([
      { status: 0, stderr: '', stdout: '' }
    ]);
    collectDiffText({ dependencies, repoRoot: '/repo', staged: false });
    expect(calls[0]?.args).toEqual([
      'diff',
      '--no-color',
      '--unified=3',
      '--no-ext-diff'
    ]);
  });
});

describe('collectChangedFiles', () => {
  it('splits stdout on newlines and drops empties', () => {
    const { dependencies } = makeDependencies([
      { status: 0, stderr: '', stdout: 'a.ts\n  b.ts \n\n c.ts\n' }
    ]);
    const files = collectChangedFiles({
      dependencies,
      repoRoot: '/repo',
      staged: true
    });
    expect(files).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('uses --name-only with diff --cached when staged', () => {
    const { calls, dependencies } = makeDependencies([
      { status: 0, stderr: '', stdout: '' }
    ]);
    collectChangedFiles({ dependencies, repoRoot: '/repo', staged: true });
    expect(calls[0]?.args).toEqual(['diff', '--cached', '--name-only']);
  });

  it('passes refs through when not staged', () => {
    const { calls, dependencies } = makeDependencies([
      { status: 0, stderr: '', stdout: '' }
    ]);
    collectChangedFiles({
      baseRef: 'main',
      dependencies,
      headRef: 'HEAD',
      repoRoot: '/repo',
      staged: false
    });
    expect(calls[0]?.args).toEqual(['diff', '--name-only', 'main', 'HEAD']);
  });
});
