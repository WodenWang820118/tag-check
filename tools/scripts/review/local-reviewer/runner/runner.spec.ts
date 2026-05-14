// region Imports

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ensureLocalReviewerBuild, runLocalReviewerReview } from './runner.ts';
import type {
  CommandResult,
  LocalReviewerDependencies,
} from '../shared/shared.ts';

// endregion

test('ensureLocalReviewerBuild runs the local-reviewer Nx build target', () => {
  const { calls, dependencies } = createDependencies({
    status: 0,
    stderr: '',
    stdout: '',
  });

  ensureLocalReviewerBuild('C:/tools/local-reviewer-cli', dependencies);

  assert.equal(calls.length, 1);
  assert.match(calls[0].command, /^pnpm/);
  assert.deepEqual(calls[0].args, ['nx', 'build', 'local-reviewer']);
  assert.equal(calls[0].cwd, 'C:/tools/local-reviewer-cli');
});

test('runLocalReviewerReview passes staged mode and requested profiles through env', () => {
  const { calls, dependencies } = createDependencies({
    status: 0,
    stderr: '',
    stdout: JSON.stringify({ summary: 'ok', findings: [] }),
  });

  const report = runLocalReviewerReview({
    dependencies,
    requestedProfiles: ['typescript', 'repo-habits'],
    staged: true,
    targetRepoRoot: 'C:/repo',
    toolRepoRoot: 'C:/tools/local-reviewer-cli',
  });

  assert.equal(report.summary, 'ok');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].args.slice(-2), ['--staged', '--json']);
  assert.equal(
    calls[0].env?.LOCAL_REVIEWER_REQUESTED_PROFILES,
    'typescript,repo-habits',
  );
});

test('runLocalReviewerReview requires staged mode or base/head refs', () => {
  const { dependencies } = createDependencies({
    status: 0,
    stderr: '',
    stdout: '{}',
  });

  assert.throws(
    () =>
      runLocalReviewerReview({
        dependencies,
        staged: false,
        targetRepoRoot: 'C:/repo',
        toolRepoRoot: 'C:/tools/local-reviewer-cli',
      }),
    /requires either staged=true or base\/head refs/,
  );
});

function createDependencies(result: CommandResult): {
  calls: Parameters<LocalReviewerDependencies['runProcess']>[0][];
  dependencies: LocalReviewerDependencies;
} {
  const calls: Parameters<LocalReviewerDependencies['runProcess']>[0][] = [];

  return {
    calls,
    dependencies: {
      now: () => new Date('2026-04-24T00:00:00.000Z'),
      runProcess: (input) => {
        calls.push(input);
        return result;
      },
    },
  };
}
