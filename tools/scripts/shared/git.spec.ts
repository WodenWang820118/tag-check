import { describe, expect, it, vi } from 'vitest';
import {
  collectRepoChangedFiles,
  collectRepoDiffText,
  collectRepoHasUntrackedFiles,
  getRepoContext,
  resolveGitCommand,
  runGitTextOrNull,
  runGitTextOrThrow
} from './git.ts';
import type { CommandResult, SyncCommandRunner } from './process.ts';

function ok(stdout: string): CommandResult {
  return { status: 0, stdout, stderr: '' };
}

function fail(stderr: string): CommandResult {
  return { status: 1, stdout: '', stderr };
}

function makeRunner(responses: ReadonlyArray<CommandResult>): {
  runner: SyncCommandRunner;
  calls: Array<{ command: string; args: string[]; cwd: string }>;
} {
  const calls: Array<{ command: string; args: string[]; cwd: string }> = [];
  let i = 0;
  const runner: SyncCommandRunner = (input) => {
    calls.push({ command: input.command, args: input.args, cwd: input.cwd });
    const next = responses[i++] ?? fail('no more responses');
    return next;
  };
  return { runner, calls };
}

describe('runGitTextOrNull', () => {
  it('returns trimmed stdout on success', () => {
    const { runner } = makeRunner([ok('  hello\n')]);
    expect(runGitTextOrNull({ args: ['x'], cwd: '/r', runner })).toBe('hello');
  });

  it('returns untrimmed stdout when trimOutput is false', () => {
    const { runner } = makeRunner([ok('  hello\n')]);
    expect(
      runGitTextOrNull({ args: ['x'], cwd: '/r', runner, trimOutput: false })
    ).toBe('  hello\n');
  });

  it('returns null when status is non-zero', () => {
    const { runner } = makeRunner([fail('boom')]);
    expect(runGitTextOrNull({ args: ['x'], cwd: '/r', runner })).toBeNull();
  });

  it('uses provided gitCommand', () => {
    const { runner, calls } = makeRunner([ok('v')]);
    runGitTextOrNull({
      args: ['--version'],
      cwd: '/r',
      gitCommand: 'C:/git.exe',
      runner
    });
    expect(calls[0].command).toBe('C:/git.exe');
  });
});

describe('runGitTextOrThrow', () => {
  it('returns the result on success', () => {
    const { runner } = makeRunner([ok('out')]);
    expect(runGitTextOrThrow({ args: ['x'], cwd: '/r', runner }).stdout).toBe(
      'out'
    );
  });

  it('throws with stderr message on failure', () => {
    const { runner } = makeRunner([fail('bad')]);
    expect(() => runGitTextOrThrow({ args: ['x'], cwd: '/r', runner })).toThrow(
      'bad'
    );
  });
});

describe('resolveGitCommand', () => {
  it('returns the first candidate that responds successfully', () => {
    const { runner } = makeRunner([ok('git version 2.0')]);
    expect(resolveGitCommand({ cwd: '/r', runner })).toBe('git');
  });

  it('returns null when no candidates respond', () => {
    const runner = vi.fn(() => fail('nope'));
    expect(resolveGitCommand({ cwd: '/r', runner })).toBeNull();
    expect(runner).toHaveBeenCalled();
  });
});

describe('getRepoContext', () => {
  it('returns a partial context when git is not available', () => {
    const runner = vi.fn(() => fail('no git'));
    const ctx = getRepoContext({ cwd: '/r', runner });
    expect(ctx).toEqual({
      root: '/r',
      branch: null,
      head: null,
      dirty: null,
      gitCommand: null
    });
  });

  it('populates root, branch, head, and dirty from git output', () => {
    const { runner } = makeRunner([
      ok('git version 2.0'), // resolveGitCommand
      ok('/repo'), // rev-parse --show-toplevel
      ok('main'), // rev-parse --abbrev-ref HEAD
      ok('abc123'), // rev-parse HEAD
      ok(' M file.ts\n') // status --porcelain
    ]);
    const ctx = getRepoContext({ cwd: '/r', runner });
    expect(ctx).toEqual({
      root: '/repo',
      branch: 'main',
      head: 'abc123',
      dirty: true,
      gitCommand: 'git'
    });
  });
});

describe('collectRepoChangedFiles', () => {
  it('returns normalized paths from porcelain status output', () => {
    const { runner } = makeRunner([
      ok(' M tools\\scripts\\shared\\git.ts\r\n?? new\\file.ts\r\n')
    ]);
    expect(collectRepoChangedFiles({ repoRoot: '/r', runner })).toEqual([
      'tools/scripts/shared/git.ts',
      'new/file.ts'
    ]);
  });

  it('handles rename arrows by keeping the destination path', () => {
    const { runner } = makeRunner([ok('R  old.ts -> new.ts\n')]);
    expect(collectRepoChangedFiles({ repoRoot: '/r', runner })).toEqual([
      'new.ts'
    ]);
  });

  it('returns an empty array when there is no output', () => {
    const { runner } = makeRunner([fail('')]);
    expect(collectRepoChangedFiles({ repoRoot: '/r', runner })).toEqual([]);
  });
});

describe('collectRepoHasUntrackedFiles', () => {
  it('returns true when status output contains "?? " lines', () => {
    const { runner } = makeRunner([ok(' M tracked.ts\n?? untracked.ts\n')]);
    expect(collectRepoHasUntrackedFiles({ repoRoot: '/r', runner })).toBe(true);
  });

  it('returns false when no untracked lines exist', () => {
    const { runner } = makeRunner([ok(' M tracked.ts\n')]);
    expect(collectRepoHasUntrackedFiles({ repoRoot: '/r', runner })).toBe(
      false
    );
  });
});

describe('collectRepoDiffText', () => {
  it('joins worktree and cached diffs with a newline', () => {
    const { runner } = makeRunner([ok('worktree-diff'), ok('cached-diff')]);
    expect(collectRepoDiffText({ repoRoot: '/r', runner })).toBe(
      'worktree-diff\ncached-diff'
    );
  });

  it('skips failed diff invocations', () => {
    const { runner } = makeRunner([fail('x'), ok('only-cached')]);
    expect(collectRepoDiffText({ repoRoot: '/r', runner })).toBe('only-cached');
  });

  it('returns empty string when both diffs fail', () => {
    const { runner } = makeRunner([fail('x'), fail('y')]);
    expect(collectRepoDiffText({ repoRoot: '/r', runner })).toBe('');
  });
});
